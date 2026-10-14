import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import managerRoutes from "./routes/manager.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import { initChatSocket } from "./socket/chat.socket.js";
import { seedDatabaseIfEmpty } from "./utils/seedData.js";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io real-time chat gateway
initChatSocket(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, "../../frontend/dist");

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

// Base Route / Frontend Static Serving
if (process.env.SERVE_FRONTEND === "true" && fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  app.get("/", (req, res) => {
    res.json({ message: "CRM Backend API is running successfully!" });
  });
}

// Authentication Routes
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
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

// Meta Webhooks Routes (/api/webhooks/meta)
app.use("/api/webhooks", webhookRoutes);
app.use("/webhooks", webhookRoutes);

// Leads Management & Social Channel Analytics Routes (/api/leads)
app.use("/api/leads", leadRoutes);
app.use("/leads", leadRoutes);

// Real-Time Customer-to-Agent Chat & Manager Quality Audit Routes (/api/chat, /api/conversations, /api/manager/chat-reports)
app.use("/api/chat", chatRoutes);
app.use("/chat", chatRoutes);
app.use("/api", chatRoutes);
app.use("/api/conversations", chatRoutes);

// Customer Portal Assigned Agent & Solutions Routes (/api/customer)
app.use("/api/customer", customerRoutes);
app.use("/customer", customerRoutes);

// Catch-all SPA route for frontend routing in unified container mode
if (process.env.SERVE_FRONTEND === "true" && fs.existsSync(clientDistPath)) {
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/admin") ||
      req.path.startsWith("/manager") ||
      req.path.startsWith("/agent") ||
      req.path.startsWith("/webhooks") ||
      req.path.startsWith("/leads") ||
      req.path.startsWith("/chat")
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Start Server with Socket.io WebSockets
server.listen(PORT, () => {
  console.log(`Server and WebSockets are running on port ${PORT}`);
});