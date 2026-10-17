/**
 * Industry-Specific Policies & Dynamic Custom Fields
 * 
 * Configures tailored sales progression stages, form definitions,
 * and custom data schemas per SaaS industry tenant.
 */

export const INDUSTRY_POLICIES = {
  real_estate: {
    key: "real_estate",
    label: "Real Estate & Properties",
    defaultStatus: "New",
    statuses: [
      "New",
      "Contacted",
      "Site Visit Scheduled",
      "Negotiation",
      "Deal Closed",
      "Lost"
    ],
    fields: [
      { key: "propertyType", label: "Property Type", type: "select", options: ["Residential Apartment", "Luxury Villa", "Commercial Office", "Penthouse", "Plot / Land"], default: "Residential Apartment" },
      { key: "budget", label: "Target Budget", type: "text", placeholder: "$250,000 - $500,000" },
      { key: "locationPreference", label: "Preferred City / Area", type: "text", placeholder: "Downtown, Metro Heights" },
      { key: "bedrooms", label: "Bedrooms", type: "select", options: ["1 BHK / Studio", "2 BHK", "3 BHK", "4+ BHK", "Commercial"], default: "2 BHK" },
      { key: "moveInDate", label: "Expected Move-in / Timeline", type: "text", placeholder: "Immediate, Within 30 days" }
    ]
  },

  restaurant: {
    key: "restaurant",
    label: "Restaurant & Hospitality",
    defaultStatus: "New Inquiry",
    statuses: [
      "New Inquiry",
      "Table Reserved",
      "Party Confirmed",
      "Completed",
      "Cancelled"
    ],
    fields: [
      { key: "partySize", label: "Party Size (Guests)", type: "select", options: ["1 - 2 Guests", "3 - 5 Guests", "6 - 10 Guests", "10+ Large Party / Event"], default: "2 Guests" },
      { key: "reservationDate", label: "Reservation Date", type: "date" },
      { key: "reservationTime", label: "Preferred Time", type: "text", placeholder: "7:30 PM" },
      { key: "occasion", label: "Dining Occasion", type: "select", options: ["Casual Dinner", "Birthday Celebration", "Anniversary", "Business Dinner", "Family Gathering"], default: "Casual Dinner" },
      { key: "seatingPreference", label: "Seating Preference", type: "select", options: ["Indoor Main Hall", "Outdoor Terrace", "Private VIP Booth", "Bar Lounge"], default: "Indoor Main Hall" },
      { key: "dietaryRestrictions", label: "Dietary Preferences", type: "text", placeholder: "Vegetarian, Gluten-free, None" }
    ]
  },

  automotive: {
    key: "automotive",
    label: "Automotive & Dealerships",
    defaultStatus: "New Inquiry",
    statuses: [
      "New Inquiry",
      "Test Drive Scheduled",
      "Quote Sent",
      "Financing Review",
      "Sold",
      "Lost"
    ],
    fields: [
      { key: "vehicleModel", label: "Desired Vehicle / Model", type: "text", placeholder: "e.g. Tesla Model Y, BMW 3 Series" },
      { key: "vehicleCondition", label: "Condition", type: "select", options: ["Brand New", "Certified Pre-Owned", "Used"], default: "Brand New" },
      { key: "tradeIn", label: "Trade-In Existing Vehicle?", type: "select", options: ["No Trade-in", "Yes, have trade-in"], default: "No Trade-in" },
      { key: "financingNeeded", label: "Financing Preference", type: "select", options: ["Cash Purchase", "Financing / Loan", "Leasing"], default: "Financing / Loan" },
      { key: "testDrivePreferred", label: "Schedule Test Drive?", type: "select", options: ["Yes, please schedule", "Just inquiring on price"], default: "Yes, please schedule" }
    ]
  },

  services: {
    key: "services",
    label: "Professional Services & Agencies",
    defaultStatus: "Discovery Call",
    statuses: [
      "Discovery Call",
      "Proposal Sent",
      "Contract Signed",
      "Active Project",
      "Completed",
      "Lost"
    ],
    fields: [
      { key: "serviceRequired", label: "Service Required", type: "select", options: ["Consulting & Advisory", "Software & IT Services", "Marketing & Branding", "Legal & Financial Services", "Other"], default: "Consulting & Advisory" },
      { key: "companyName", label: "Client Organization", type: "text", placeholder: "Acme Corp" },
      { key: "projectTimeline", label: "Project Timeline", type: "select", options: ["Urgent (< 2 weeks)", "1 - 3 Months", "Quarterly / Ongoing"], default: "1 - 3 Months" },
      { key: "estimatedBudget", label: "Estimated Budget", type: "text", placeholder: "$10,000 - $25,000" }
    ]
  },

  retail: {
    key: "retail",
    label: "Retail & Commerce",
    defaultStatus: "New Inquiry",
    statuses: [
      "New Inquiry",
      "In Discussion",
      "Quote Provided",
      "Order Placed",
      "Fulfilled",
      "Closed"
    ],
    fields: [
      { key: "productCategory", label: "Product Category", type: "text", placeholder: "Wholesale Apparel, Electronics" },
      { key: "estimatedQuantity", label: "Estimated Quantity / Units", type: "text", placeholder: "100 - 500 units" },
      { key: "deliveryLocation", label: "Delivery City / Country", type: "text", placeholder: "New York, USA" }
    ]
  },

  general_business: {
    key: "general_business",
    label: "General Enterprise & Other",
    defaultStatus: "New",
    statuses: [
      "New",
      "Contacted",
      "In Progress",
      "Qualified",
      "Closed",
      "Lost"
    ],
    fields: [
      { key: "inquiryType", label: "Inquiry Type", type: "select", options: ["General Inquiry", "Product Demo", "Partnership", "Support"], default: "General Inquiry" },
      { key: "budget", label: "Estimated Budget", type: "text", placeholder: "Optional" }
    ]
  }
};

/**
 * Normalizes industry type key
 */
export const normalizeIndustryType = (rawType) => {
  if (!rawType) return "real_estate";
  const clean = String(rawType).toLowerCase().trim().replace(/\s+/g, "_");
  if (INDUSTRY_POLICIES[clean]) return clean;
  if (clean === "restaurant" || clean === "dining" || clean === "food") return "restaurant";
  if (clean === "automotive" || clean === "auto" || clean === "cars") return "automotive";
  if (clean === "services" || clean === "service" || clean === "consulting") return "services";
  if (clean === "retail" || clean === "shop" || clean === "ecommerce") return "retail";
  return "general_business";
};

/**
 * Returns policy configuration for a given industry
 */
export const getPolicyForIndustry = (industryType) => {
  const normalized = normalizeIndustryType(industryType);
  return INDUSTRY_POLICIES[normalized] || INDUSTRY_POLICIES.real_estate;
};

/**
 * Returns default lead status for an industry
 */
export const getDefaultStatusForIndustry = (industryType) => {
  const policy = getPolicyForIndustry(industryType);
  return policy.defaultStatus || "New";
};

/**
 * Utility to convert company name into a URL-friendly unique slug
 */
export const slugify = (text) => {
  if (!text) return "company-" + Math.floor(1000 + Math.random() * 9000);
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};
