import mongoose from "mongoose";
import Lead from "../models/lead.model.js";
import Activity from "../models/activity.model.js";
import Staff from "../models/staff.model.js";
import User from "../models/user.model.js";

// GET /api/agent/dashboard & GET /api/agent/my-leads
// Strictly real database data: ONLY leads assigned to the logged-in agent
export const getAgentDashboard = async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) user = await User.findById(userId);
    if (!user && userEmail) user = await User.findOne({ email: userEmail });

    const staff = userEmail ? await Staff.findOne({ email: userEmail }) : null;
    const finalName = staff?.name || user?.name || req.user?.name || (userEmail ? userEmail.split('@')[0] : "Sales Agent");
    const finalEmail = staff?.email || user?.email || userEmail || "agent@crm.com";
    const finalRole = staff?.role || user?.role || "agent";
    const finalAvatar = user?.avatar || staff?.avatar || "";

    // 1. Fetch strictly leads assigned to this agent and belonging to their company
    const leadQueryConditions = [];
    if (user?._id) leadQueryConditions.push({ assignedAgent: user._id });
    if (staff?._id) leadQueryConditions.push({ assignedAgent: staff._id });
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      leadQueryConditions.push({ assignedAgent: new mongoose.Types.ObjectId(userId) });
    }

    const companyFilter = {};
    if (req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId)) {
      companyFilter.company = req.user.companyId;
    }

    const leadsQuery = leadQueryConditions.length > 0
      ? { ...companyFilter, $or: leadQueryConditions }
      : { ...companyFilter, assignedAgent: null };

    const leads = await Lead.find(leadsQuery)
      .populate("assignedAgent", "name email role avatar")
      .sort({ updatedAt: -1 });

    // 2. Real Lead Counts strictly from the Agent's assigned leads
    const totalLeads = leads.length;
    const newCount = leads.filter((l) => l.status === "New").length;
    const contactedCount = leads.filter((l) => l.status === "Contacted").length;
    const siteVisitsCount = leads.filter((l) => l.status === "Site Visit Scheduled").length;
    const closedCount = leads.filter((l) => l.status === "Deal Closed" || l.status === "Closed").length;

    return res.status(200).json({
      success: true,
      agent: {
        id: user?._id || staff?._id,
        _id: user?._id || staff?._id,
        name: finalName,
        email: finalEmail,
        role: finalRole,
        avatar: finalAvatar
      },
      stats: {
        totalLeads,
        newLeads: newCount,
        contacted: contactedCount,
        siteVisitsScheduled: siteVisitsCount,
        dealsClosed: closedCount
      },
      leads
    });
  } catch (error) {
    console.error("Agent Dashboard Error:", error);
    return res.status(500).json({ error: "Failed to load agent dashboard" });
  }
};

// GET /api/agent/my-leads
export const getMyAssignedLeads = async (req, res) => {
  return getAgentDashboard(req, res);
};

// PATCH /api/agent/leads/:id/status or PUT /api/agent/leads/:id
// Update lead status and/or append follow-up notes
export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, notes, text } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Update real estate status if provided
    if (status) {
      lead.status = status;
    }

    // Append follow-up note if provided
    const noteContent = note || notes || text;
    if (noteContent && typeof noteContent === "string" && noteContent.trim().length > 0) {
      if (!Array.isArray(lead.notes)) {
        lead.notes = [];
      }
      lead.notes.push({
        text: noteContent.trim(),
        date: new Date()
      });
    }

    await lead.save();
    const updatedLead = await Lead.findById(id).populate("assignedAgent", "name email role avatar");

    await Activity.create({
      title: `Lead updated: ${lead.clientName}`,
      description: `Status: ${lead.status}${noteContent ? ` | Note added: "${noteContent.trim()}"` : ""}`,
      type: "lead",
      user: req.user?.email || "Agent",
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead: updatedLead
    });
  } catch (error) {
    console.error("Update Lead Error:", error);
    return res.status(500).json({ error: "Failed to update lead" });
  }
};
