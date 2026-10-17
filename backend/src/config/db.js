import mongoose from "mongoose";

// Setup Mongoose connection lifecycle listeners to prevent unhandled socket drops
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB cluster.");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection event error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose connection disconnected.");
});

export const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/auth_db";
  try {
    const conn = await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB at:", mongoUrl);
    return conn;
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    return null;
  }
};

