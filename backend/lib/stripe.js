import Stripe from "stripe";

// Get the key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Debug logging
console.log("Stripe Initialization");
console.log("Stripe key available:", !!stripeSecretKey);

if (stripeSecretKey) {
  console.log("Key starts with:", stripeSecretKey.substring(0, Math.min(20, stripeSecretKey.length)) + '...');
  
  // Validate key format
  if (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_')) {
    console.warn("Stripe key doesn't start with 'sk_test_' or 'sk_live_'");
    console.warn("Expected format: sk_test_or sk_live_");
  }
} else {
  console.error("CRITICAL: STRIPE_SECRET_KEY is not defined!");
  console.error("This usually means:");
  console.error("1. .env file is missing or in wrong location");
  console.error("2. dotenv.config() was not called before this import");
  console.error("3. .env file doesn't contain STRIPE_SECRET_KEY");
  console.error("");
  console.error("Check that in server.js, dotenv.config() is the VERY FIRST thing.");
  console.error("Current working directory:", process.cwd());
}

// Create Stripe instance or mock if no key
let stripeInstance;

if (!stripeSecretKey || stripeSecretKey.trim() === '') {
  console.error("Creating mock Stripe instance (will fail when used)");
  
  stripeInstance = {
    checkout: { 
      sessions: {
        create: async (...args) => {
          console.error("STRIPE NOT CONFIGURED: Attempted to create checkout session");
          console.error("Check your .env file and server.js import order");
          throw new Error("Stripe not configured. STRIPE_SECRET_KEY is missing. Check server logs.");
        },
        retrieve: async (...args) => {
          console.error("STRIPE NOT CONFIGURED: Attempted to retrieve session");
          throw new Error("Stripe not configured.");
        }
      }
    },
    coupons: {
      create: async (...args) => {
        console.error("STRIPE NOT CONFIGURED: Attempted to create coupon");
        throw new Error("Stripe not configured.");
      }
    }
  };
} else {
  try {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      timeout: 10000,
      maxNetworkRetries: 2,
    });
    
    console.log("Stripe instance created successfully");
    
    //  Testing connection async, won't block
    stripeInstance.accounts.retrieve()
      .then(account => {
        console.log(`Stripe connected to account: ${account.id}`);
        console.log(`   Mode: ${account.charges_enabled ? 'LIVE' : 'TEST'}`);
      })
      .catch(err => {
        console.error("Stripe connection test failed:", err.message);
        console.error("The key might be invalid or network issue");
      });
    
  } catch (error) {
    console.error("Failed to create Stripe instance:", error.message);
    console.error("Creating mock instance instead");
    
    stripeInstance = {
      checkout: {
        sessions: {
          create: async () => {
            throw new Error(`Stripe initialization failed: ${error.message}`);
          }
        }
      }
    };
  }
}

export const stripe = stripeInstance;