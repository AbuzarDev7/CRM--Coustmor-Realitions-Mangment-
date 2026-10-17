import mongoose from "mongoose";
import { slugify, getPolicyForIndustry } from "../config/industryPolicies.js";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    companySlug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    businessType: {
      type: String,
      enum: [
        "real_estate",
        "restaurant",
        "general_business",
        "automotive",
        "healthcare",
        "retail",
        "services"
      ],
      default: "real_estate",
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: ""
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias: industryType <-> businessType
companySchema.virtual("industryType")
  .get(function () {
    return this.businessType;
  })
  .set(function (val) {
    this.businessType = val;
  });

// Pre-validate hook: automatically generate unique companySlug from companyName
companySchema.pre("validate", function () {
  if (!this.companySlug && this.companyName) {
    this.companySlug = slugify(this.companyName);
  }
});

// Helper method to retrieve this company's dynamic policy
companySchema.methods.getIndustryPolicy = function () {
  return getPolicyForIndustry(this.businessType);
};

export const Company = mongoose.model("Company", companySchema);
export default Company;
