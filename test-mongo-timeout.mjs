import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log("Testing MongoDB connection with timeout...");

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI not found");
  process.exit(1);
}

// Set a global timeout
const timeout = setTimeout(() => {
  console.error("❌ Connection timeout after 15 seconds");
  console.log("Your IP might not be whitelisted or network issues");
  process.exit(1);
}, 15000);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
})
.then(() => {
  clearTimeout(timeout);
  console.log("✅ MongoDB connected!");
  console.log("Host:", mongoose.connection.host);
  process.exit(0);
})
.catch(err => {
  clearTimeout(timeout);
  console.error("❌ Connection failed:", err.message);
  
  if (err.message.includes('ENOTFOUND')) {
    console.log("DNS lookup failed - check your connection string");
  } else if (err.message.includes('ECONNREFUSED')) {
    console.log("Connection refused - IP not whitelisted or wrong credentials");
  } else if (err.message.includes('timed out')) {
    console.log("Timeout - network or firewall issue");
  }
  
  process.exit(1);
});
