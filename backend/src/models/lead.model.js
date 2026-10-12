import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: ""
    },
    company: {
      type: String,
      default: "Individual Client",
      trim: true
    },
    source: {
      type: String,
      enum: [
        "Organic Website",
        "Facebook & Social Ads",
        "Client Referrals",
        "Cold Outreach & Email",
        "Other"
      ],
      default: "Organic Website"
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Qualified", "Proposal Sent", "Converted", "Lost"],
      default: "New"
    },
    estimatedValue: {
      type: Number,
      default: 0
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
