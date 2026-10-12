import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    stage: {
      type: String,
      enum: [
        "Prospecting",
        "Qualified",
        "Proposal Sent",
        "Negotiation",
        "Closed Won",
        "Closed Lost"
      ],
      default: "Prospecting"
    },
    probability: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    },
    closeDate: {
      type: Date
    },
    month: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export const Deal = mongoose.model("Deal", dealSchema);
export default Deal;
