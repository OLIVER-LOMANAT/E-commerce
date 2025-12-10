import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (one level up)
const envPath = path.join(__dirname, '..', '.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

import Stripe from 'stripe';

console.log("Testing Stripe connection...");
console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ No Stripe secret key found in .env");
  console.log("Current directory:", process.cwd());
  console.log("All env vars starting with STRIPE:");
  Object.keys(process.env).forEach(key => {
    if (key.includes('STRIPE')) {
      console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
    }
  });
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

try {
  const account = await stripe.accounts.retrieve();
  console.log("✅ Stripe connected successfully!");
  console.log("Account ID:", account.id);
  console.log("Mode:", account.charges_enabled ? "Live" : "Test");
} catch (error) {
  console.error("❌ Stripe connection failed:", error.message);
}
