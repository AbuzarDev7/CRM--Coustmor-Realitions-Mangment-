import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      default: "Account Executive",
      trim: true
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    },
    dealsClosed: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 85,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ["Online", "Offline", "In Meeting", "On Leave"],
      default: "Online"
    },
    monthlyQuota: {
      type: Number,
      default: 50000
    },
    phone: {
      type: String,
      default: ""
    },
    department: {
      type: String,
      default: "Sales"
    },
    category: {
      type: String,
      enum: ["manager", "agent", "staff"],
      default: "agent"
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
      default: null
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    managerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

export const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
