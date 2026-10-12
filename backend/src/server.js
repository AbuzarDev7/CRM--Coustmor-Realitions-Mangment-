import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import managerRoutes from "./routes/manager.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import { seedDatabaseIfEmpty } from "./utils/seedData.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB & Seed if needed
connectDB().then(() => {
  seedDatabaseIfEmpty();
});

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any localhost or 127.0.0.1 port (e.g. 5173, 5174, 5175)
      if (
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);
app.use(cookieParser());
app.use(express.json());

// Base Route
app.get("/", (req, res) => {
  res.json({ message: "CRM Backend API is running successfully!" });
});

// Authentication Routes
app.use("/api/auth", authRoutes);
app.use("/", authRoutes);

// Admin Dashboard Routes
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);
app.use("/api/auth/admin", adminRoutes);

// Manager Dashboard Routes
app.use("/api/manager", managerRoutes);
app.use("/manager", managerRoutes);
app.use("/api/auth/manager", managerRoutes);

// Sales Agent Dashboard Routes
app.use("/api/agent", agentRoutes);
app.use("/agent", agentRoutes);
app.use("/api/auth/agent", agentRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});