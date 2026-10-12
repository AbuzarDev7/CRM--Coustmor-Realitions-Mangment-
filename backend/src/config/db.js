import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/auth_db";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB at:", mongoUrl);
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

