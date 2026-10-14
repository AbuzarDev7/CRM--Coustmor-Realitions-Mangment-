import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    customerId: {
      type: String,
      default: ""
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    customerPhone: {
      type: String,
      default: ""
    },
    agent: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    agentId: {
      type: String,
      default: ""
    },
    agentName: {
      type: String,
      default: "Sales Representative"
    },
    agentEmail: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["active", "closed", "ended", "reported_to_manager"],
      default: "active"
    },
    lastMessage: {
      type: String,
      default: ""
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    messageCount: {
      type: Number,
      default: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date
    },
    report: {
      summary: {
        type: String,
        default: ""
      },
      customerSentiment: {
        type: String,
        enum: ["Positive", "Neutral", "Negative", ""],
        default: "Positive"
      },
      sentiment: {
        type: String,
        enum: ["Positive", "Neutral", "Negative", ""],
        default: "Positive"
      },
      resolvedStatus: {
        type: String,
        enum: ["Resolved", "Pending Follow-up", "Escalated", ""],
        default: "Resolved"
      },
      resolutionStatus: {
        type: String,
        enum: ["Resolved", "Pending Follow-up", "Escalated", ""],
        default: "Resolved"
      },
      totalMessagesCount: {
        type: Number,
        default: 0
      },
      agentNotes: {
        type: String,
        default: ""
      },
      submittedAt: {
        type: Date
      },
      submittedBy: {
        type: String,
        default: ""
      }
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ customerEmail: 1, status: 1 });
conversationSchema.index({ agentEmail: 1, status: 1 });
conversationSchema.index({ "report.submittedAt": -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
