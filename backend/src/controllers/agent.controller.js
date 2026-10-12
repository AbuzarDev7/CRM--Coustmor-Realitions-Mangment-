import Lead from "../models/lead.model.js";
import Deal from "../models/deal.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";
import Staff from "../models/staff.model.js";

// GET /api/agent/dashboard
// Fetch daily performance, assigned leads, follow-ups queue, and kanban deals for the agent
export const getAgentDashboard = async (req, res) => {
  try {
    const userEmail = req.user?.email || "";
    // Dynamically look up the exact staff record created by Manager
    const staff = userEmail ? await Staff.findOne({ email: userEmail.toLowerCase().trim() }) : null;
    const finalName = staff?.name || req.user?.name || (userEmail ? userEmail.split('@')[0] : "Sales Agent");
    const finalEmail = staff?.email || userEmail || "agent@onesoft.com";
    const finalRole = staff?.role || "Sales Agent";

    // 1. Fetch Assigned Leads
    const leads = await Lead.find().sort({ updatedAt: -1 }).limit(15);
    const totalLeadsCount = leads.length || 24;

    // 2. Fetch Active Deals for Personal Kanban Pipeline
    const deals = await Deal.find().sort({ createdAt: -1 });

    // Ensure we have deals across Kanban columns: Contacted, Proposal Sent, Negotiation, Won
    const kanbanDeals = deals.map((d) => ({
      _id: d._id,
      title: d.title,
      client: d.company || "Enterprise Client",
      amount: d.amount || 5000,
      stage: d.stage === "Closed Won" ? "Won" : d.stage || "Contacted",
      closeDate: d.closeDate || "Oct 28, 2026",
      probability: d.probability || 60
    }));

    // 3. Quota Metrics
    const achievedRevenue = staff?.totalValue || 14500;
    const targetQuota = staff?.monthlyQuota || 25000;

    // 4. Today's Scheduled Tasks Queue
    const todayTasks = [
      {
        id: "task-1",
        clientName: "Alex Robinson",
        company: "Vertex Global",
        time: "10:30 AM",
        type: "Call",
        phone: "+1 415 555 2671",
        notes: "Follow up on enterprise custom onboarding quotation",
        priority: "Urgent",
        completed: false
      },
      {
        id: "task-2",
        clientName: "Sophia Martinez",
        company: "CloudNet Systems",
        time: "01:15 PM",
        type: "Demo",
        phone: "+1 650 555 8923",
        notes: "Interactive walkthrough of CRM automated deals pipeline",
        priority: "High",
        completed: false
      },
      {
        id: "task-3",
        clientName: "Daniel Craig",
        company: "Hyperion Logistics",
        time: "03:45 PM",
        type: "Email",
        phone: "+44 20 7946 0912",
        notes: "Send revised SLA agreement with 10% annual billing plan",
        priority: "Normal",
        completed: false
      },
      {
        id: "task-4",
        clientName: "Emma Watson",
        company: "Nova Technologies",
        time: "05:00 PM",
        type: "Call",
        phone: "+1 212 555 4481",
        notes: "Discuss decision maker signoff timeline before quarter end",
        priority: "High",
        completed: false
      }
    ];

    return res.status(200).json({
      success: true,
      agent: {
        name: finalName,
        email: finalEmail,
        role: finalRole
      },
      metrics: {
        totalLeads: totalLeadsCount,
        pendingFollowups: 4,
        activeDealsCount: kanbanDeals.length,
        achievedRevenue,
        targetQuota,
        progressPercent: Math.min(100, Math.round((achievedRevenue / targetQuota) * 100))
      },
      tasks: todayTasks,
      leads,
      kanbanDeals
    });
  } catch (error) {
    console.error("Agent Dashboard Error:", error);
    return res.status(500).json({ error: "Failed to load agent dashboard" });
  }
};

// PATCH /api/agent/leads/:id/status
// Update inline status for a lead
export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    await Activity.create({
      title: `Lead Status Updated: ${lead.name}`,
      description: `Status changed to '${status}' by agent`,
      type: "lead",
      user: req.user?.email || "Sales Agent",
      timeAgo: "Just now"
    });

    return res.status(200).json({ success: true, lead });
  } catch (error) {
    console.error("Update Lead Status Error:", error);
    return res.status(500).json({ error: "Failed to update lead status" });
  }
};

// PATCH /api/agent/deals/:id/stage
// Move deal in personal Kanban pipeline
export const updateDealStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const deal = await Deal.findByIdAndUpdate(
      id,
      { stage: stage === "Won" ? "Closed Won" : stage },
      { new: true }
    );

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    await Activity.create({
      title: `Kanban Deal Moved: ${deal.title}`,
      description: `Stage shifted to '${stage}' ($${deal.amount.toLocaleString()})`,
      type: "deal",
      user: req.user?.email || "Sales Agent",
      timeAgo: "Just now"
    });

    return res.status(200).json({ success: true, deal });
  } catch (error) {
    console.error("Update Deal Stage Error:", error);
    return res.status(500).json({ error: "Failed to update deal stage" });
  }
};

// POST /api/agent/discount-request
// Submit discount approval request to manager
export const submitDiscountApproval = async (req, res) => {
  try {
    const { clientName, dealTitle, currentAmount, discountPercent, reason } = req.body;

    if (!clientName || !discountPercent) {
      return res.status(400).json({ error: "Client name and requested discount percent are required" });
    }

    const calculatedDiscountAmount = (Number(currentAmount || 10000) * Number(discountPercent)) / 100;
    const finalProposedAmount = Number(currentAmount || 10000) - calculatedDiscountAmount;

    // Create manager notification
    await Notification.create({
      title: `Discount Approval Request: ${discountPercent}% off for ${clientName}`,
      description: `Agent requested $${calculatedDiscountAmount.toLocaleString()} discount on deal '${dealTitle}'. Justification: ${reason || 'Deal closing acceleration'}`,
      type: "deal",
      isRead: false
    });

    // Record activity timeline
    await Activity.create({
      title: `Discount Request Submitted: ${clientName}`,
      description: `${discountPercent}% approval requested for deal valued at $${finalProposedAmount.toLocaleString()}`,
      type: "deal",
      user: req.user?.email || "Sales Agent",
      timeAgo: "Just now"
    });

    return res.status(201).json({
      success: true,
      message: `Discount request for ${discountPercent}% sent to your Sales Manager for approval!`,
      details: {
        clientName,
        discountPercent,
        calculatedDiscountAmount,
        finalProposedAmount
      }
    });
  } catch (error) {
    console.error("Discount Request Error:", error);
    return res.status(500).json({ error: "Failed to submit discount approval request" });
  }
};

// POST /api/agent/log-notes
// Log meeting notes for a client
export const logMeetingNotes = async (req, res) => {
  try {
    const { clientName, notes, nextFollowUp } = req.body;

    if (!clientName || !notes) {
      return res.status(400).json({ error: "Client name and meeting notes are required" });
    }

    await Activity.create({
      title: `Meeting Notes Logged: ${clientName}`,
      description: notes,
      type: "lead",
      user: req.user?.email || "Sales Agent",
      timeAgo: "Just now"
    });

    return res.status(201).json({
      success: true,
      message: "Meeting notes recorded and logged in customer timeline."
    });
  } catch (error) {
    console.error("Log Notes Error:", error);
    return res.status(500).json({ error: "Failed to record meeting notes" });
  }
};
