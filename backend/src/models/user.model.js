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
    name: {
      type: String,
      default: "",
      trim: true
    },
    avatar: {
      type: String,
      default: ""
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local"
    },
    googleId: {
      type: String,
      sparse: true
    },
    githubId: {
      type: String,
      sparse: true
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "staff", "agent", "sales_agent", "engineer", "customer", "custmor", "user"],
      default: "customer",
      lowercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export default User;
