import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
  console.log("createCheckoutSession called");
  console.log("User ID:", req.user?._id);
  console.log("Request body products:", req.body.products?.length || 0);
  
  try {
    const { products, couponCode } = req.body;

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      console.error("Invalid products array");
      return res.status(400).json({ 
        error: "Invalid or empty products array",
        received: products 
      });
    }

    // Validate each product
    for (const product of products) {
      if (!product.price || product.price <= 0) {
        console.error("Invalid product price:", product);
        return res.status(400).json({ 
          error: `Invalid price for product: ${product.name}`,
          product 
        });
      }
    }

    let totalAmount = 0;
    const lineItems = products.map((product) => {
      // Fix: Check if price is in dollars (like 18.00) or cents (like 1800)
      let amount;
      if (product.price > 1000) {
        // If price looks like 1800, assume it's already in cents? Or dollars?
        // Let's assume it's dollars but missing decimal: 1800 means $18.00
        amount = Math.round((product.price / 100) * 100);
      } else {
        amount = Math.round(product.price * 100);
      }
      
      const quantity = product.quantity || 1;
      totalAmount += amount * quantity;

      // Create product_data WITHOUT empty description
      const productData = {
        name: product.name || 'Product',
        images: product.image ? [product.image] : [],
      };
      
      // Only add description if it exists and is not empty
      if (product.description && product.description.trim() !== '') {
        productData.description = product.description;
      }
      // If no description, don't add the field at all

      return {
        price_data: {
          currency: "usd",
          product_data: productData,
          unit_amount: amount,
        },
        quantity: quantity,
      };
    });

    console.log(`Line items: ${lineItems.length}, Total: $${totalAmount / 100}`);

    // Handle coupon
    let coupon = null;
    let stripeCouponId = null;
    
    if (couponCode) {
      console.log(`Checking coupon: ${couponCode}`);
      coupon = await Coupon.findOne({ 
        code: couponCode, 
        userId: req.user._id, 
        isActive: true 
      });
      
      if (coupon) {
        console.log(`Coupon found: ${coupon.discountPercentage}% off`);
        const discountAmount = Math.round((totalAmount * coupon.discountPercentage) / 100);
        totalAmount -= discountAmount;
        console.log(`New total after coupon: $${totalAmount / 100}`);
        
        // Create Stripe coupon
        try {
          stripeCouponId = await createStripeCoupon(coupon.discountPercentage);
          console.log(`Stripe coupon created: ${stripeCouponId}`);
        } catch (couponError) {
          console.error("Failed to create Stripe coupon:", couponError.message);
          // Continue without coupon rather than failing
          stripeCouponId = null;
        }
      } else {
        console.log("Coupon not found or not active");
      }
    }

    // Prepare session data
    const sessionData = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/purchase-cancel`,
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            name: p.name,
            quantity: p.quantity || 1,
            price: p.price,
          }))
        ),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'KE'],
      },
      customer_email: req.user.email,
    };

    // Add discounts if coupon exists
    if (stripeCouponId) {
      sessionData.discounts = [{ coupon: stripeCouponId }];
      console.log("Added discount to session");
    }

    console.log("Creating Stripe session...");
    
    // Create Stripe session
    const session = await stripe.checkout.sessions.create(sessionData);
    
    console.log("Stripe session created!");
    console.log("Session ID:", session.id);
    console.log("Session URL:", session.url);
    console.log("Amount total:", session.amount_total);

    // Create gift coupon for large purchases ($200+)
    if (totalAmount >= 20000) {
      console.log("Creating gift coupon for large purchase");
      try {
        await createNewCoupon(req.user._id);
      } catch (couponError) {
        console.error("Failed to create gift coupon:", couponError.message);
      }
    }
    
    res.status(200).json({ 
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      totalAmount: totalAmount / 100,
      message: "Checkout session created successfully"
    });
    
  } catch (error) {
    console.error("Error in createCheckoutSession:", error);
    console.error("Error stack:", error.stack);
    
    if (error.type === 'StripeInvalidRequestError') {
      console.error("Stripe error details:", error.raw || error);
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const checkoutSuccess = async (req, res) => {
  console.log("checkoutSuccess called");
  console.log("Session ID:", req.body.sessionId);
  
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID is required" 
      });
    }

    console.log("Retrieving Stripe session:", sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session status:", session.payment_status);
    console.log("Session metadata:", session.metadata);

    if (session.payment_status === "paid") {
      console.log("Payment confirmed as paid");
      
      // Deactivate coupon if used
      if (session.metadata.couponCode) {
        console.log(`Deactivating coupon: ${session.metadata.couponCode}`);
        try {
          await Coupon.findOneAndUpdate(
            {
              code: session.metadata.couponCode,
              userId: session.metadata.userId,
            },
            {
              isActive: false,
              usedAt: new Date(),
            }
          );
          console.log("Coupon deactivated");
        } catch (couponError) {
          console.error("Failed to deactivate coupon:", couponError.message);
        }
      }

      // Parse products from metadata
      let products = [];
      try {
        products = JSON.parse(session.metadata.products || '[]');
        console.log(`Products in order: ${products.length}`);
      } catch (parseError) {
        console.error("Failed to parse products:", parseError);
        products = [];
      }

      // Create order
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          name: product.name,
          quantity: product.quantity || 1,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
        status: 'completed',
      });

      await newOrder.save();
      console.log("Order created:", newOrder._id);

      res.status(200).json({
        success: true,
        message: "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
        order: newOrder,
      });
    } else {
      console.log("Payment not completed, status:", session.payment_status);
      res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${session.payment_status}`,
      });
    }
  } catch (error) {
    console.error("Error in checkoutSuccess:", error);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({ 
      success: false,
      message: "Error processing successful checkout",
      error: error.message,
    });
  }
};

async function createStripeCoupon(discountPercentage) {
  console.log(`Creating Stripe coupon: ${discountPercentage}% off`);
  
  try {
    const coupon = await stripe.coupons.create({
      percent_off: Math.min(Math.max(discountPercentage, 1), 100),
      duration: "once",
      name: `${discountPercentage}% Discount`,
    });
    
    console.log(`Stripe coupon created: ${coupon.id}`);
    return coupon.id;
    
  } catch (error) {
    console.error("Failed to create Stripe coupon:", error.message);
    throw new Error(`Failed to create Stripe coupon: ${error.message}`);
  }
}

async function createNewCoupon(userId) {
  console.log("Creating new gift coupon for user:", userId);
  
  try {
    // Check if user already has an active gift coupon
    const existingCoupon = await Coupon.findOne({ 
      userId,
      code: /^GIFT/,
      isActive: true
    });
    
    if (existingCoupon) {
      console.log("User already has active gift coupon:", existingCoupon.code);
      return existingCoupon;
    }
    
    // Generate a unique coupon code
    const couponCode = "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newCoupon = new Coupon({
      code: couponCode,
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userId: userId,
      isActive: true,
    });

    await newCoupon.save();
    console.log(`Gift coupon created: ${couponCode}`);
    
    return newCoupon;
    
  } catch (error) {
    console.error("Failed to create gift coupon:", error.message);
    // Don't crash the checkout process
    return null;
  }
}