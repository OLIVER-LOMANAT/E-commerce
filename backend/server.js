import dotenv from "dotenv";
// Load environment variables IMMEDIATELY
dotenv.config();
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the root directory (where package.json is)
const rootDir = path.resolve(__dirname, '..');
console.log("Root directory (where package.json is):", rootDir);
console.log("Backend directory:", __dirname);

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
    environment: process.env.NODE_ENV || 'development',
    rootDir: rootDir,
    backendDir: __dirname
  });
});

// Production static files
if (process.env.NODE_ENV === "production") {
  console.log("Production mode: Serving frontend files");
  
  // Frontend build is in root/frontend/dist
  const frontendBuildPath = path.join(rootDir, 'frontend', 'dist');
  console.log(`Looking for frontend build at: ${frontendBuildPath}`);
  
  // Check if frontend build exists
  const fs = await import('fs');
  if (fs.existsSync(frontendBuildPath)) {
    console.log(`Found frontend build at: ${frontendBuildPath}`);
    console.log(`Serving static files from: ${frontendBuildPath}`);
    
    app.use(express.static(frontendBuildPath));
    
    // Handle all other routes by serving index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendBuildPath, "index.html"));
    });
  } else {
    console.log("No frontend build found, running API-only mode");
    console.log("Expected path:", frontendBuildPath);
    
    app.get("/", (req, res) => {
      res.json({ 
        message: "E-commerce API is running", 
        frontend: "Frontend build not found. Check if 'npm run build' ran successfully.",
        expectedPath: frontendBuildPath,
        api: "API available at /api endpoints"
      });
    });
  }
} else {
  // Development mode
  app.get("/", (req, res) => {
    res.json({ 
      message: "E-commerce API is running in development mode",
      frontend: "Running on http://localhost:5173",
      api: "Available at /api endpoints",
      rootDir: rootDir,
      backendDir: __dirname
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Root directory: ${rootDir}`);
  console.log(`Backend directory: ${__dirname}`);
  connectDB();
});