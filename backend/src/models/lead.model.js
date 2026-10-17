import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      default: "Agent"
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
      default: null
    },
    clientName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    source: {
      type: String,
      default: "Website Inquiry",
      trim: true
    },
    // Flexible object for business-specific data (e.g. property type, table booking, budget, etc.)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    status: {
      type: String,
      default: "New",
      trim: true
    },
    notes: {
      type: [noteSchema],
      default: []
    },
    // Retained for direct field access & backward compatibility
    requirements: {
      type: String,
      default: "",
      trim: true
    },
    budget: {
      type: String,
      default: "",
      trim: true
    },
    propertyType: {
      type: String,
      default: "Residential",
      trim: true
    },
    message: {
      type: String,
      default: "",
      trim: true
    },
    estimatedValue: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-validate hook to sync legacy fields and business-specific details
leadSchema.pre("validate", function () {
  // Ensure details object exists
  if (!this.details || typeof this.details !== "object") {
    this.details = {};
  }

  // Sync requirements & message into details
  if (this.requirements && !this.details.requirements) {
    this.details.requirements = this.requirements;
  } else if (this.details.requirements && !this.requirements) {
    this.requirements = this.details.requirements;
  }

  if (this.budget && !this.details.budget) {
    this.details.budget = this.budget;
  }
  if (this.propertyType && !this.details.propertyType) {
    this.details.propertyType = this.propertyType;
  }
  if (this.message && !this.details.message) {
    this.details.message = this.message;
  }

  // Normalize clientName if legacy name passed
  if (!this.clientName && this.get("name")) {
    this.clientName = this.get("name");
  }

  // Normalize assignedAgent if legacy assignedTo passed
  if (!this.assignedAgent && this.get("assignedTo")) {
    this.assignedAgent = this.get("assignedTo");
  }

  // Status normalization
  if (this.status) {
    const s = this.status.toString().toLowerCase().trim();
    if (s === "new") {
      this.status = "New";
    } else if (s === "contacted") {
      this.status = "Contacted";
    } else if (s === "site visit scheduled" || s === "site visit" || s === "visit scheduled") {
      this.status = "Site Visit Scheduled";
    } else if (s === "deal closed" || s === "closed" || s === "won" || s === "closed won") {
      this.status = "Deal Closed";
    } else if (s === "in progress" || s === "negotiation") {
      this.status = "In Progress";
    }
  }
});

// Virtuals for backwards compatibility
leadSchema.virtual("name").get(function () {
  return this.clientName;
}).set(function (val) {
  this.clientName = val;
});

leadSchema.virtual("assignedTo").get(function () {
  return this.assignedAgent;
}).set(function (val) {
  this.assignedAgent = val;
});

export const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
