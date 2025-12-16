import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

// DYNAMIC CORS CONFIGURATION
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://e-commerce-ruby-seven-24.vercel.app',
      'https://e-commerce-eyoslhb8u-oliver-lomanats-projects.vercel.app'
    ]
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Backend is working",
    corsAllowed: allowedOrigins,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Cookie test endpoint
app.get("/api/test-cookies", (req, res) => {
  res.json({
    cookiesReceived: req.cookies,
    origin: req.get('origin'),
    secure: req.secure,
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working",
    frontend: "https://e-commerce-ruby-seven-24.vercel.app",
    backend: "https://e-commerce-18gj.onrender.com",
    timestamp: new Date().toISOString()
  });
});

// For all other routes
app.get("/", (req, res) => {
  res.json({ 
    message: "E-commerce API",
    docs: "Use /api endpoints",
    cors: "Configured for cross-domain cookies",
    allowedOrigins: allowedOrigins
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS allowed origins:`);
  allowedOrigins.forEach(origin => console.log(`- ${origin}`));
  connectDB();
});