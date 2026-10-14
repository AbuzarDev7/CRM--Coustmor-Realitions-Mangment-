import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    senderRole: {
      type: String,
      enum: ["customer", "agent", "manager", "admin", "system", "staff"],
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderEmail: {
      type: String,
      default: ""
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
