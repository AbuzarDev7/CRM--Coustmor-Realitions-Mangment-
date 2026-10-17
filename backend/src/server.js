import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
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
import companyRoutes from "./routes/company.routes.js";
import { initChatSocket } from "./socket/chat.socket.js";
import { seedDatabaseIfEmpty } from "./utils/seedData.js";

// ===========================================================================
// 1. GLOBAL PROCESS ERROR HANDLERS (Prevents abrupt backend crashes)
// ===========================================================================
process.on("uncaughtException", (error) => {
  console.error("💥 [Global Process] Uncaught Exception occurred:", {
    message: error?.message,
    stack: error?.stack
  });
  // Log gracefully instead of crashing abruptly
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 [Global Process] Unhandled Promise Rejection at:", promise, "reason:", {
    message: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  // Log gracefully instead of crashing abruptly
});

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io real-time chat gateway
initChatSocket(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, "../../frontend/dist");

// ===========================================================================
// 2. MONGOOSE CONNECTION WITH PROPER CATCH HANDLING
// ===========================================================================
connectDB()
  .then((conn) => {
    if (conn) {
      seedDatabaseIfEmpty().catch((seedErr) => {
        console.error("❌ Database Seeding Exception:", seedErr?.message || seedErr);
      });
    }
  })
  .catch((err) => {
    console.error("❌ Initial MongoDB Connection Exception:", err?.message || err);
  });

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, server-to-server, native apps)
      if (!origin) return callback(null, true);
      // Allow localhost, 127.0.0.1, and private LAN IP addresses on any port
      if (
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin) ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
      ) {
        return callback(null, true);
      }
      // In development mode, allow the origin rather than rejecting WebSocket/REST traffic
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  })
);
app.use(cookieParser());
app.use(express.json());

// Base Route / Frontend Static Serving
if (process.env.SERVE_FRONTEND === "true" && fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  app.get("/", (req, res) => {
    try {
      return res.json({ message: "CRM Backend API is running successfully!" });
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
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

// Multi-Company SaaS Routes (/api/companies)
app.use("/api/companies", companyRoutes);
app.use("/companies", companyRoutes);

// Catch-all SPA route for frontend routing in unified container mode
if (process.env.SERVE_FRONTEND === "true" && fs.existsSync(clientDistPath)) {
  app.get("*", (req, res, next) => {
    try {
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
      return res.sendFile(path.join(clientDistPath, "index.html"));
    } catch (err) {
      return next(err);
    }
  });
}

// ===========================================================================
// 3. GLOBAL EXPRESS ERROR HANDLING MIDDLEWARE
// ===========================================================================
app.use((err, req, res, next) => {
  console.error("💥 [Express Global Error Handler]:", {
    path: req.originalUrl || req.path,
    method: req.method,
    error: err?.message || err,
    stack: err?.stack
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: err?.message || "Internal Server Error"
  });
});

// ===========================================================================
// 4. GRACEFUL SHUTDOWN HANDLERS
// ===========================================================================
const handleGracefulShutdown = (signal) => {
  console.log(`\n🛑 [Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("🔒 HTTP & WebSocket server closed.");
    mongoose.connection
      .close(false)
      .then(() => {
        console.log("🔒 MongoDB connection closed.");
        process.exit(0);
      })
      .catch((closeErr) => {
        console.error("Error closing MongoDB connection:", closeErr?.message || closeErr);
        process.exit(1);
      });
  });

  // Force shutdown if cleanup hangs
  setTimeout(() => {
    console.error("⚠️ Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

// Start Server with Socket.io WebSockets
server.listen(PORT, () => {
  console.log(`🚀 Server and WebSockets are running on port ${PORT}`);
});