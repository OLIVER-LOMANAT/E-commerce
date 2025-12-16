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

// SIMPLE CORS - Remove all that complicated code
app.use(cors({
  origin: ['http://localhost:5173', 'https://e-commerce-eyoslhb8u-oliver-lomanats-projects.vercel.app'],
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
    message: "Backend is working"
  });
});

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working",
    frontend: "https://e-commerce-eyoslhb8u-oliver-lomanats-projects.vercel.app",
    backend: "https://e-commerce-18gj.onrender.com"
  });
});

// For all other routes
app.get("/", (req, res) => {
  res.json({ 
    message: "E-commerce API",
    docs: "Use /api endpoints"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});