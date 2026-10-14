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
        "Facebook",
        "Instagram",
        "LinkedIn",
        "WhatsApp",
        "Website",
        "Referral",
        "Organic Website",
        "Facebook & Social Ads",
        "Client Referrals",
        "Cold Outreach & Email",
        "facebook",
        "instagram",
        "linkedin",
        "whatsapp",
        "website",
        "referral",
        "Other"
      ],
      default: "Website"
    },
    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal Sent",
        "Converted",
        "Closed Won",
        "Lost",
        "new",
        "closed",
        "won"
      ],
      default: "New"
    },
    value: {
      type: Number,
      default: 0
    },
    estimatedValue: {
      type: Number,
      default: 0
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    notes: {
      type: String,
      default: ""
    },
    metaData: {
      leadgenId: { type: String, default: "" },
      pageId: { type: String, default: "" },
      formId: { type: String, default: "" },
      adId: { type: String, default: "" },
      platform: { type: String, default: "" },
      rawFieldData: { type: mongoose.Schema.Types.Mixed, default: {} }
    }
  },
  { timestamps: true }
);

export const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
