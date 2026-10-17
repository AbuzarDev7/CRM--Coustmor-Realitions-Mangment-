import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    type: {
      type: String,
      enum: ["deal", "lead", "system", "payment", "staff", "other"],
      default: "system"
    },
    user: {
      type: String,
      default: "System"
    },
    timeAgo: {
      type: String,
      default: "Just now"
    }
  },
  { timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
