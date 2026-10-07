import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());

// Base Route
app.get("/", (req, res) => {
  res.json({ message: "CRM Backend API is running successfully!" });
});

// Authentication Routes
// Mounted at both '/api/auth' and root for backward compatibility
app.use("/api/auth", authRoutes);
app.use("/", authRoutes);

// Placeholder for future CRM module routes:
// app.use("/api/customers", customerRoutes);
// app.use("/api/leads", leadRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});