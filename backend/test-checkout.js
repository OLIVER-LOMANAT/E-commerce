import dotenv from 'dotenv';
dotenv.config();

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function testCheckout() {
  try {
    console.log("Creating test checkout session...");
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
    });
    
    console.log("✅ Checkout session created!");
    console.log("Session ID:", session.id);
    console.log("Session URL:", session.url);
    console.log("\nVisit this URL to test:", session.url);
    
    // Try to retrieve it
    const retrieved = await stripe.checkout.sessions.retrieve(session.id);
    console.log("✅ Session retrieved successfully");
    
  } catch (error) {
    console.error("❌ Failed to create checkout session:", error.message);
    console.error("Stripe error:", error.raw ? JSON.stringify(error.raw, null, 2) : error);
  }
}

testCheckout();
