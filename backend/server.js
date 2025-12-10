// ⚠️⚠️⚠️ THIS MUST BE AT THE VERY TOP - BEFORE ANY OTHER IMPORTS ⚠️⚠️⚠️
import dotenv from "dotenv";
// Load environment variables IMMEDIATELY
dotenv.config();

// DEBUG: Check if env vars are loaded
console.log("=== Environment Variables Check ===");
console.log("PORT:", process.env.PORT || "NOT FOUND");
console.log("MONGO_URI:", process.env.MONGO_URI ? "FOUND" : "NOT FOUND");
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "FOUND" : "NOT FOUND");
console.log("UPSTASH_REDIS_URL:", process.env.UPSTASH_REDIS_URL ? "FOUND" : "NOT FOUND");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("==================================");

// Now import other modules (AFTER dotenv.config())
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current working directory for production
const currentDir = process.cwd();
console.log("Current directory:", currentDir);

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'https://e-commerce-store.onrender.com',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Production static files
if (process.env.NODE_ENV === "production") {
  console.log("🔄 Production mode: Serving frontend files");
  
  // Try multiple possible paths for frontend build
  const possiblePaths = [
    path.join(currentDir, 'frontend', 'dist'),
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(currentDir, 'dist')
  ];
  
  let staticPath = null;
  for (const p of possiblePaths) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(p)) {
        console.log(`✅ Found frontend build at: ${p}`);
        staticPath = p;
        break;
      }
    } catch (error) {
      console.log(`❌ Path not found: ${p}`);
    }
  }
  
  if (staticPath) {
    console.log(`📁 Serving static files from: ${staticPath}`);
    app.use(express.static(staticPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    console.log("⚠️ No frontend build found, running API-only mode");
    app.get("/", (req, res) => {
      res.json({ 
        message: "E-commerce API is running", 
        frontend: "Frontend not built or not found",
        docs: "Use /api endpoints"
      });
    });
  }
} else {
  // Development mode
  app.get("/", (req, res) => {
    res.json({ 
      message: "E-commerce API is running in development mode",
      frontend: "Running on http://localhost:5173",
      api: "Available at /api endpoints"
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`📁 Current directory: ${currentDir}`);
  connectDB();
});