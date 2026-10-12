import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
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
      enum: ["deal", "lead", "system", "security", "alert"],
      default: "system"
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
