import mongoose from "mongoose";
import Lead from "../models/lead.model.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";
import Company from "../models/company.model.js";
import {
  getDefaultStatusForIndustry,
  getPolicyForIndustry,
  slugify
} from "../config/industryPolicies.js";

/**
 * Normalizes acquisition source string to standard title case
 */
const normalizeSource = (src) => {
  if (!src) return "Website";
  const s = src.toLowerCase().trim();
  if (s === "facebook" || s.includes("facebook") || s === "fb") return "Facebook";
  if (s === "instagram" || s.includes("instagram") || s === "ig") return "Instagram";
  if (s === "whatsapp" || s.includes("whatsapp") || s === "wa") return "WhatsApp";
  if (s === "direct call" || s === "manual/call" || s === "call" || s === "phone" || s === "manual" || s.includes("call")) return "Direct Call";
  if (s === "linkedin" || s.includes("linkedin")) return "LinkedIn";
  if (s === "twitter" || s.includes("twitter") || s === "x") return "Twitter";
  if (s === "website" || s.includes("website") || s.includes("organic")) return "Website";
  if (s === "referral" || s.includes("referral")) return "Referral";
  return src;
};

/**
 * 0. GET /api/leads/public/company/:companySlug
 * Public endpoint to fetch company profile, branding, and dynamic industry fields
 */
export const getPublicCompanyBySlug = async (req, res) => {
  try {
    const rawSlug = (req.params.companySlug || req.params.slugOrId || "").trim();
    if (!rawSlug) {
      return res.status(400).json({ success: false, error: "Company slug or identifier is required" });
    }

    let company = await Company.findOne({ companySlug: rawSlug.toLowerCase() });
    if (!company && mongoose.Types.ObjectId.isValid(rawSlug)) {
      company = await Company.findById(rawSlug);
    }
    if (!company) {
      company = await Company.findOne({
        companyName: { $regex: new RegExp(`^${rawSlug.replace(/-/g, " ")}$`, "i") }
      });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found. Please verify the URL."
      });
    }

    if (company.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "This company account is currently inactive or suspended."
      });
    }

    const policy = getPolicyForIndustry(company.businessType);

    return res.status(200).json({
      success: true,
      company: {
        _id: company._id,
        companyName: company.companyName,
        companySlug: company.companySlug,
        businessType: company.businessType,
        industryType: company.businessType,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        address: company.address,
        settings: company.settings || {},
        policy
      }
    });
  } catch (error) {
    console.error("Get Public Company Error:", error);
    return res.status(500).json({ success: false, error: "Failed to load company profile" });
  }
};

/**
 * 1. POST /api/leads/public/:companySlug
 * Multi-Tenant Lead Routing (Public Form to Specific Company)
 * Automatically binds lead strictly to the target company's database
 * and routes it to that company's Manager dashboard.
 */
export const submitCompanyPublicLead = async (req, res) => {
  try {
    const rawSlug = (req.params.companySlug || req.body.companySlug || req.body.companyId || "").trim();
    if (!rawSlug) {
      return res.status(400).json({ success: false, error: "Company identifier (slug or ID) is required" });
    }

    let company = await Company.findOne({ companySlug: rawSlug.toLowerCase() });
    if (!company && mongoose.Types.ObjectId.isValid(rawSlug)) {
      company = await Company.findById(rawSlug);
    }
    if (!company) {
      company = await Company.findOne({
        companyName: { $regex: new RegExp(`^${rawSlug.replace(/-/g, " ")}$`, "i") }
      });
    }

    if (!company) {
      return res.status(404).json({ success: false, error: "Target company does not exist" });
    }

    if (company.status !== "active") {
      return res.status(403).json({ success: false, error: "Target company is currently suspended or inactive" });
    }

    const {
      name,
      clientName,
      email,
      phone,
      message,
      requirements,
      source,
      details,
      ...otherFields
    } = req.body;

    const resolvedName = (clientName || name || "").trim();
    const resolvedEmail = (email || "").toLowerCase().trim();
    const resolvedPhone = (phone || "").trim();
    const resolvedMessage = (message || requirements || "").trim();

    if (!resolvedName) {
      return res.status(400).json({ success: false, error: "Your name is required" });
    }
    if (!resolvedEmail) {
      return res.status(400).json({ success: false, error: "A valid email address is required" });
    }

    // Merge custom industry fields into flexible details object
    const mergedDetails = {
      ...(typeof details === "object" ? details : {}),
      ...otherFields
    };
    delete mergedDetails.companySlug;
    delete mergedDetails.companyId;

    const defaultStatus = getDefaultStatusForIndustry(company.businessType);

    const newLead = await Lead.create({
      company: company._id,
      clientName: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      message: resolvedMessage,
      requirements: resolvedMessage || mergedDetails.propertyType || mergedDetails.serviceRequired || mergedDetails.vehicleModel || "Public inquiry",
      source: normalizeSource(source || `${company.companyName} Public Form`),
      details: mergedDetails,
      status: defaultStatus,
      assignedAgent: null,
      notes: []
    });

    // Create company-isolated activity & notification
    await Activity.create({
      company: company._id,
      title: `New ${company.businessType} Lead: ${newLead.clientName}`,
      description: `Inquiry received via ${company.companyName} public portal`,
      type: "lead",
      user: "Public Portal",
      timeAgo: "Just now"
    }).catch(() => {});

    await Notification.create({
      company: company._id,
      title: `New Lead: ${newLead.clientName}`,
      description: `${newLead.clientName} (${newLead.email}) submitted an inquiry.`,
      type: "lead",
      isRead: false
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Your inquiry has been successfully sent to ${company.companyName}! Our manager will review and follow up shortly.`,
      leadId: newLead._id,
      company: {
        _id: company._id,
        name: company.companyName,
        slug: company.companySlug,
        industry: company.businessType
      }
    });
  } catch (error) {
    console.error("Submit Company Public Lead Error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit inquiry to company" });
  }
};

/**
 * 2. POST /api/leads/submit
 * General / Fallback Customer Inquiry Submission
 */
export const submitCustomerInquiry = async (req, res) => {
  try {
    const {
      name,
      clientName,
      email,
      phone,
      message,
      requirements,
      budget,
      propertyType,
      source,
      companySlug,
      companyId,
      company
    } = req.body;

    // If companySlug or companyId provided, delegate to submitCompanyPublicLead
    if (companySlug || companyId || company) {
      req.params.companySlug = companySlug || companyId || company;
      return submitCompanyPublicLead(req, res);
    }

    const resolvedName = (clientName || name || "").trim();
    const resolvedEmail = (email || "").toLowerCase().trim();
    const resolvedRequirements = (requirements || message || "").trim();
    const resolvedPhone = (phone || "").trim();
    const resolvedBudget = (budget || "").trim();
    const resolvedPropertyType = (propertyType || "Residential").trim();

    if (!resolvedName) {
      return res.status(400).json({ success: false, error: "Client name is required" });
    }

    if (!resolvedEmail) {
      return res.status(400).json({ success: false, error: "Client email address is required" });
    }

    // Create lead with status: 'New' and unassigned
    const newLead = await Lead.create({
      clientName: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      requirements: resolvedRequirements,
      budget: resolvedBudget,
      propertyType: resolvedPropertyType,
      message: resolvedRequirements,
      source: normalizeSource(source || "Website Property Inquiry"),
      status: "New",
      assignedAgent: null,
      notes: []
    });

    // Route directly to Manager Dashboard via Activity & Notification feeds
    await Activity.create({
      title: `New Property Lead: ${newLead.clientName}`,
      description: `Inquiry for ${newLead.requirements || 'Property Purchase'} • Budget: ${newLead.budget || 'Open'}`,
      type: "lead",
      user: "Website Public Form",
      timeAgo: "Just now"
    }).catch(() => {});

    await Notification.create({
      title: `New Property Lead: ${newLead.clientName}`,
      description: `${newLead.clientName} (${newLead.email}, ${newLead.phone || 'No phone'}) inquired about: ${newLead.requirements || 'Properties'}.`,
      type: "lead",
      isRead: false
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Your property inquiry has been submitted successfully! A manager will review and assign an agent shortly.",
      lead: newLead
    });
  } catch (error) {
    console.error("Submit Property Lead Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit property inquiry",
      details: error.message
    });
  }
};

/**
 * 2. PUT /api/leads/assign/:leadId (also supports PATCH)
 * Manager Lead Assignment
 * Manager views unassigned leads and assigns them to an active Agent (assignedAgent: agentId).
 */
export const assignLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { agentId, assignedAgent } = req.body;

    const targetAgentId = agentId || assignedAgent;

    if (!targetAgentId) {
      return res.status(400).json({
        success: false,
        error: "Agent ID (agentId or assignedAgent) is required for lead assignment."
      });
    }

    // Resolve target agent from User model or Staff model
    let agentUser = null;
    if (mongoose.Types.ObjectId.isValid(targetAgentId)) {
      agentUser = await User.findById(targetAgentId);
      if (!agentUser) {
        // Fallback: check if agentId points to a Staff record
        const staff = await Staff.findById(targetAgentId);
        if (staff?.email) {
          agentUser = await User.findOne({ email: staff.email.toLowerCase().trim() });
        }
      }
    }

    if (!agentUser) {
      // Try finding user by email if string was provided
      agentUser = await User.findOne({ email: String(targetAgentId).toLowerCase().trim() });
    }

    if (!agentUser) {
      return res.status(404).json({
        success: false,
        error: "Assigned Agent user account not found in system."
      });
    }

    // Update lead with assignedAgent ObjectId and update status to Contacted
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignedAgent: agentUser._id,
        status: "Contacted"
      },
      { new: true }
    ).populate("assignedAgent", "name email role avatar");

    if (!updatedLead) {
      return res.status(404).json({
        success: false,
        error: "Lead not found"
      });
    }

    // Log Activity
    const managerIdentifier = req.user?.name || req.user?.email || "Manager";
    await Activity.create({
      title: `Lead Assigned: ${updatedLead.clientName}`,
      description: `Lead assigned to Agent ${agentUser.name || agentUser.email} by ${managerIdentifier}.`,
      type: "lead",
      user: managerIdentifier,
      timeAgo: "Just now"
    }).catch(() => {});

    // Notify the Agent
    await Notification.create({
      title: `New Lead Assigned to You: ${updatedLead.clientName}`,
      description: `Manager assigned prospect ${updatedLead.clientName} (${updatedLead.email}) to your dashboard.`,
      type: "lead",
      isRead: false
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Lead successfully assigned to agent ${agentUser.name || agentUser.email}`,
      lead: updatedLead
    });
  } catch (error) {
    console.error("Assign Lead Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to assign lead",
      details: error.message
    });
  }
};

/**
 * 3. GET /api/agent/my-leads (or /api/leads/my-leads)
 * Agent Dashboard Leads Fetch
 * Agents fetch ONLY the leads where assignedAgent matches their logged-in user ID.
 */
export const getMyAssignedLeads = async (req, res) => {
  try {
    const loggedInUserId = req.user?.userId || req.user?._id || req.user?.id;
    const loggedInEmail = (req.user?.email || "").toLowerCase().trim();

    if (!loggedInUserId && !loggedInEmail) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to view assigned leads."
      });
    }

    // Identify matching user and staff ids
    const queryConditions = [];

    if (loggedInUserId && mongoose.Types.ObjectId.isValid(loggedInUserId)) {
      queryConditions.push({ assignedAgent: new mongoose.Types.ObjectId(loggedInUserId) });
    }

    // Also include staff ID if agent was assigned via staff record
    if (loggedInEmail) {
      const staffMember = await Staff.findOne({ email: loggedInEmail });
      if (staffMember) {
        queryConditions.push({ assignedAgent: staffMember._id });
      }
    }

    const query = queryConditions.length > 1 ? { $or: queryConditions } : (queryConditions[0] || { assignedAgent: null });

    const leads = await Lead.find(query)
      .populate("assignedAgent", "name email role avatar")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    console.error("Get My Leads Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch assigned leads for agent",
      details: error.message
    });
  }
};

/**
 * 4. PUT /api/leads/update/:leadId (also supports PATCH)
 * Agent Lead Update
 * Agents update the lead status (New, Contacted, In Progress, Closed) and append notes/history.
 */
export const updateLeadByAgent = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, note, notes, text } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    // Validate and update status if provided (Real Estate Lead workflow)
    if (status) {
      const validStatuses = [
        "New",
        "Contacted",
        "Site Visit Scheduled",
        "Deal Closed",
        "In Progress",
        "Closed"
      ];
      // Normalize status case
      const matchedStatus = validStatuses.find((s) => s.toLowerCase() === status.toLowerCase().trim());
      if (!matchedStatus) {
        return res.status(400).json({
          success: false,
          error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`
        });
      }
      lead.status = matchedStatus;
    }

    // Append follow-up note if provided
    const noteText = (typeof note === "string" ? note : (note?.text || notes || text || "")).trim();
    if (noteText) {
      if (!Array.isArray(lead.notes)) {
        lead.notes = [];
      }
      lead.notes.push({
        text: noteText,
        date: new Date()
      });
    }

    await lead.save();
    await lead.populate("assignedAgent", "name email role avatar");

    // Record activity
    const agentName = req.user?.name || req.user?.email || "Agent";
    await Activity.create({
      title: `Lead Updated: ${lead.clientName}`,
      description: `Status: '${lead.status}' ${noteText ? `| Note: "${noteText.slice(0, 50)}..."` : ""}`,
      type: "lead",
      user: agentName,
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead
    });
  } catch (error) {
    console.error("Update Lead Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update lead",
      details: error.message
    });
  }
};

/**
 * 5. GET /api/leads
 * Fetch leads with optional search, source filter, and status filter
 */
export const getLeadsList = async (req, res) => {
  try {
    const { source, status, search, limit = 50, companyId } = req.query;
    const query = {};

    // Multi-tenant isolation: enforce company context unless superadmin
    if (req.user?.role !== "superadmin" && req.user?.companyId) {
      query.company = req.user.companyId;
    } else if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      query.company = companyId;
    }

    if (source && source !== "all") {
      query.source = source;
    }

    if (status && status !== "all") {
      query.status = { $regex: new RegExp(`^${status}$`, "i") };
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { clientName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { company: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } }
      ];
    }

    const leads = await Lead.find(query)
      .populate("assignedAgent", "name email role avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const count = await Lead.countDocuments(query);

    return res.status(200).json({
      success: true,
      count,
      leads
    });
  } catch (error) {
    console.error("Get Leads Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch leads list",
      details: error.message
    });
  }
};

/**
 * 6. POST /api/leads/create
/**
 * 6. POST /api/leads/create-manual & POST /api/leads/create
 * Manual Lead Entry (for leads coming from Facebook Ads, Instagram, WhatsApp, Direct Call, Walk-in, etc.)
 * Accessible by Superadmin and Manager.
 */
export const createManualLead = async (req, res) => {
  try {
    const {
      name,
      clientName,
      email,
      phone,
      requirements,
      message,
      budget,
      propertyType = "Residential",
      company,
      source = "Direct Call",
      estimatedValue = 0,
      note,
      notes,
      assignedAgent,
      agentId,
      status = "New"
    } = req.body;

    const resolvedName = (clientName || name || "").trim();
    const resolvedEmail = (email || "").toLowerCase().trim();
    const resolvedRequirements = (requirements || message || "").trim();
    const resolvedPhone = (phone || "").trim();
    const resolvedBudget = (budget || "").trim();
    const resolvedPropertyType = (propertyType || "Residential").trim();

    if (!resolvedName) {
      return res.status(400).json({ success: false, error: "Customer name is required" });
    }

    if (!resolvedEmail) {
      return res.status(400).json({ success: false, error: "Customer email address is required" });
    }

    // Optional direct agent assignment
    let resolvedAgentId = null;
    const targetAgentId = assignedAgent || agentId;
    if (targetAgentId && targetAgentId !== "unassigned" && targetAgentId !== "null") {
      if (mongoose.Types.ObjectId.isValid(targetAgentId)) {
        const agentUser = await User.findById(targetAgentId);
        if (agentUser) {
          resolvedAgentId = agentUser._id;
        } else {
          const staff = await Staff.findById(targetAgentId);
          if (staff?.email) {
            const u = await User.findOne({ email: staff.email.toLowerCase().trim() });
            if (u) resolvedAgentId = u._id;
          }
        }
      }
    }

    // Prepare initial notes
    const initialNotes = [];
    const noteText = (typeof note === "string" ? note : (notes || "")).trim();
    if (noteText) {
      initialNotes.push({
        text: noteText,
        date: new Date()
      });
    }

    // Resolve company ObjectId ref for SaaS multi-tenant isolation
    let targetCompanyId = null;
    if (req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId)) {
      targetCompanyId = req.user.companyId;
    } else if (req.body.companyId && mongoose.Types.ObjectId.isValid(req.body.companyId)) {
      targetCompanyId = req.body.companyId;
    }

    const leadPayload = {
      clientName: resolvedName,
      name: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      company: targetCompanyId,
      source: normalizeSource(source),
      details: {
        requirements: resolvedRequirements,
        budget: resolvedBudget,
        propertyType: resolvedPropertyType,
        ...(req.body.details || {})
      },
      requirements: resolvedRequirements,
      message: resolvedRequirements,
      budget: resolvedBudget,
      propertyType: resolvedPropertyType,
      status: status || "New",
      assignedAgent: resolvedAgentId,
      estimatedValue: Number(estimatedValue) || 0,
      notes: initialNotes
    };

    const lead = await Lead.create(leadPayload);
    if (resolvedAgentId && typeof lead.populate === "function") {
      await lead.populate("assignedAgent", "name email role avatar");
    }

    const creatorName = req.user?.name || req.user?.email || "Manager/Admin";
    await Activity.create({
      title: `Manual Lead Added: ${lead.clientName}`,
      description: `Source: ${lead.source} • Requirements: ${lead.requirements || 'Property'} • ${resolvedAgentId ? 'Assigned to Agent' : 'Unassigned'}`,
      type: "lead",
      user: creatorName,
      timeAgo: "Just now"
    }).catch(() => {});

    await Notification.create({
      title: `New Lead: ${lead.clientName}`,
      description: `Inbound lead manually added from ${lead.source} by ${creatorName}.`,
      type: "lead",
      isRead: false
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead
    });
  } catch (error) {
    console.error("Create Manual Lead Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create manual lead",
      details: error.message
    });
  }
};

/**
 * 7. GET /api/leads/source-analytics
 * Aggregates lead counts and conversion metrics grouped by acquisition source using MongoDB $group
 */
export const getSourceAnalytics = async (req, res) => {
  try {
    const sourceAggregation = await Lead.aggregate([
      {
        $group: {
          _id: "$source",
          totalLeads: { $sum: 1 },
          closedWonCount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $toLower: "$status" },
                    ["closed", "converted", "closed won", "won"]
                  ]
                },
                1,
                0
              ]
            }
          },
          totalValue: { $sum: { $ifNull: ["$estimatedValue", 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          totalLeads: 1,
          closedWonCount: 1,
          totalValue: 1,
          conversionRate: {
            $cond: [
              { $gt: ["$totalLeads", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$closedWonCount", "$totalLeads"] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    const channelColors = {
      Facebook: "#3b82f6",
      Instagram: "#ec4899",
      LinkedIn: "#0ea5e9",
      WhatsApp: "#10b981",
      Website: "#8b5cf6",
      Referral: "#f59e0b",
      Other: "#64748b"
    };

    let totalLeadsAll = 0;
    let totalWonAll = 0;
    let totalPipelineValueAll = 0;

    const formattedSources = sourceAggregation.map((item) => {
      const srcName = item.source || "Other";
      totalLeadsAll += item.totalLeads;
      totalWonAll += item.closedWonCount;
      totalPipelineValueAll += item.totalValue;

      return {
        ...item,
        name: srcName,
        value: item.totalLeads,
        color: channelColors[srcName] || "#6366f1"
      };
    });

    const overallConversionRate =
      totalLeadsAll > 0
        ? Math.round((totalWonAll / totalLeadsAll) * 1000) / 10
        : 0;

    return res.status(200).json({
      success: true,
      sources: formattedSources,
      summary: {
        totalLeads: totalLeadsAll,
        closedWonCount: totalWonAll,
        overallConversionRate,
        totalPipelineValue: totalPipelineValueAll,
        topSource: formattedSources[0]?.source || "Website",
        channelsCount: formattedSources.length
      }
    });
  } catch (error) {
    console.error("Lead Source Analytics Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate lead source analytics",
      details: error.message
    });
  }
};

/**
 * 8. POST /api/leads/simulate-webhook
 * Instant testing helper: simulates an incoming Facebook or Instagram Leadgen webhook event
 */
export const simulateMetaWebhookLead = async (req, res) => {
  try {
    const {
      platform = "Facebook",
      name = "Jessica Taylor",
      email = "jessica.t@taylordesign.com",
      phone = "+1 (555) 349-8120",
      company = "Taylor Creative Studio",
      message = "Interested in enterprise CRM deployment",
      estimatedValue = 3500
    } = req.body;

    const mockLeadgenId = `sim_${Date.now()}`;
    const mockFormId = `form_${Math.floor(100000 + Math.random() * 900000)}`;

    const newLead = await Lead.create({
      clientName: name,
      email: email.toLowerCase().trim(),
      phone,
      company,
      message,
      source: normalizeSource(platform),
      status: "New",
      assignedAgent: null,
      estimatedValue: Number(estimatedValue) || 3500,
      notes: [{ text: `Captured via Simulated Meta Webhook (Form: ${mockFormId})`, date: new Date() }],
      metaData: {
        leadgenId: mockLeadgenId,
        pageId: "page_sim_1001",
        formId: mockFormId,
        platform
      }
    });

    await Activity.create({
      title: `New ${newLead.source} Lead Ingested`,
      description: `${newLead.clientName} (${newLead.email}) submitted instant lead form`,
      type: "lead",
      user: "Meta Webhook Simulator",
      timeAgo: "Just now"
    }).catch(() => {});

    await Notification.create({
      title: `Instant ${newLead.source} Lead: ${newLead.clientName}`,
      description: `Inbound prospect captured from social ad campaign ($${newLead.estimatedValue.toLocaleString()}).`,
      type: "lead",
      isRead: false
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Simulated ${newLead.source} lead ingested successfully!`,
      lead: newLead
    });
  } catch (error) {
    console.error("Simulate Webhook Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to simulate Meta webhook lead",
      details: error.message
    });
  }
};
