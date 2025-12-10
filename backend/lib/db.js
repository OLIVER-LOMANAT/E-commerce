import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const connectDB = async () => {
  try {
    console.log("=== MongoDB Connection ===");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not defined in environment variables");
      process.exit(1);
    }
    
    console.log("Connecting to MongoDB...");
    
    // Add connection options for better reliability
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log("Database name:", conn.connection.name);
    console.log("==========================");
    
    // Add event listeners for connection issues
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error("Error connecting to MONGODB:", error.message);
    console.log("\n=== Troubleshooting ===");
    console.log("1. Check if your IP is whitelisted in MongoDB Atlas");
    console.log("2. Wait 2-3 minutes after adding IP to whitelist");
    console.log("3. Try this connection string in MongoDB Compass");
    console.log("4. Check your internet connection");
    
    // Show a masked version of the URI for debugging
    const uri = process.env.MONGO_URI || '';
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log("Connection string:", maskedUri);
    
    process.exit(1);
  }
};