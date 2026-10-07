import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["admin", "engineer", "customer", "custmor", "user"],
      default: "customer",
      lowercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export default User;
