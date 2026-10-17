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
      default: true
    },
    role: {
      type: String,
      enum: ["superadmin", "company_admin", "manager", "agent"],
      default: "agent",
      lowercase: true,
      trim: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

// Pre-validation hook to normalize role strictly to SaaS role hierarchy
userSchema.pre("validate", function () {
  if (this.role) {
    const r = this.role.toLowerCase().trim();
    if (r === "admin" || r === "superadmin" || r === "root" || r === "engineer") {
      this.role = "superadmin";
    } else if (r === "company_admin" || r === "companyadmin" || r === "owner") {
      this.role = "company_admin";
    } else if (r === "manager") {
      this.role = "manager";
    } else {
      this.role = "agent";
    }
  }
});

export const User = mongoose.model("User", userSchema);
export default User;
