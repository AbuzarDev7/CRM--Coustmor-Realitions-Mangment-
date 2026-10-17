import mongoose from "mongoose";
import Staff from "../models/staff.model.js";
import Lead from "../models/lead.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import bcrypt from "bcrypt";

// Multi-Tenant Isolation Helper
const getCompanyQuery = (req) => {
  if (req.user?.role === "superadmin") {
    if (req.query?.companyId && mongoose.Types.ObjectId.isValid(req.query.companyId)) {
      return { company: req.query.companyId };
    }
    return {};
  }
  if (req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId)) {
    return { company: req.user.companyId };
  }
  return {};
};

// GET /api/manager/overview
// Real-time overview metrics: Total incoming leads, Unassigned vs Assigned, Active agents, and Lead status breakdown
export const getManagerOverview = async (req, res) => {
  try {
    const companyFilter = getCompanyQuery(req);

    const totalLeads = await Lead.countDocuments(companyFilter);

    // Unassigned: assignedAgent is null/unassigned or status is 'New'
    const unassignedLeads = await Lead.countDocuments({
      ...companyFilter,
      $or: [
        { assignedAgent: null },
        { assignedAgent: { $exists: false } },
        { status: "New" }
      ]
    });

    const assignedLeads = Math.max(0, totalLeads - unassignedLeads);

    // Real status breakdown for analytics
    const newLeads = await Lead.countDocuments({ ...companyFilter, status: "New" });
    const contactedLeads = await Lead.countDocuments({ ...companyFilter, status: "Contacted" });
    const siteVisitsScheduled = await Lead.countDocuments({ ...companyFilter, status: "Site Visit Scheduled" });
    const inProgressLeads = await Lead.countDocuments({
      ...companyFilter,
      status: { $in: ["Contacted", "In Progress", "Site Visit Scheduled"] }
    });
    const dealsClosed = await Lead.countDocuments({
      ...companyFilter,
      status: { $in: ["Deal Closed", "Closed"] }
    });

    // Real active agents count
    const activeAgentsCount = await Staff.countDocuments({
      ...companyFilter,
      category: { $ne: "manager" }
    });

    // Status distribution chart data
    const leadStatusDistribution = [
      { name: "New Leads", status: "New", count: newLeads, fill: "#8b5cf6" },
      { name: "In Progress", status: "In Progress", count: inProgressLeads, fill: "#3b82f6" },
      { name: "Site Visits", status: "Site Visit Scheduled", count: siteVisitsScheduled, fill: "#f59e0b" },
      { name: "Deals Closed", status: "Deal Closed", count: dealsClosed, fill: "#10b981" }
    ];

    let companyRecord = null;
    let industryPolicy = null;
    if (companyFilter.company) {
      companyRecord = await Company.findById(companyFilter.company);
      if (companyRecord) industryPolicy = companyRecord.getIndustryPolicy();
    }

    return res.status(200).json({
      success: true,
      company: companyRecord
        ? {
            id: companyRecord._id,
            name: companyRecord.companyName,
            slug: companyRecord.companySlug,
            industry: companyRecord.businessType,
            industryType: companyRecord.businessType
          }
        : null,
      industryPolicy,
      stats: {
        totalLeads,
        unassignedLeads,
        assignedLeads,
        activeAgents: activeAgentsCount,
        newLeads,
        contactedLeads,
        inProgressLeads,
        siteVisitsScheduled,
        dealsClosed
      },
      leadStatusDistribution
    });
  } catch (error) {
    console.error("Manager Overview Error:", error);
    return res.status(500).json({ error: "Failed to load manager overview metrics" });
  }
};

// GET /api/manager/dashboard
// Strictly real database data: Real incoming leads, Agent management, and Lead assignment
export const getManagerDashboard = async (req, res) => {
  try {
    const targetManagerId = req.query.managerId;
    const targetManagerEmail = req.query.managerEmail;

    let managerProfile = null;
    if (targetManagerId) {
      managerProfile = await Staff.findById(targetManagerId).catch(() => null);
      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          error: "Manager profile not found in database"
        });
      }
    } else if (targetManagerEmail) {
      managerProfile = await Staff.findOne({ email: targetManagerEmail.toLowerCase().trim() }).catch(() => null);
      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          error: "Manager profile not found in database"
        });
      }
    } else if (req.user?.email) {
      managerProfile = await Staff.findOne({ email: req.user.email.toLowerCase().trim() }).catch(() => null);
    }

    // If no Staff record exists, check User model for logged-in Manager and auto-sync
    if (!managerProfile && req.user?.email) {
      const userRecord = await User.findOne({ email: req.user.email.toLowerCase().trim() }).catch(() => null);
      if (userRecord && (userRecord.role === "manager" || userRecord.role === "superadmin")) {
        managerProfile = await Staff.create({
          name: userRecord.name || "Sales Manager",
          email: userRecord.email,
          role: "Sales Manager",
          category: "manager",
          avatar: userRecord.avatar || "",
          department: "Sales Management",
          monthlyQuota: 100000,
          status: "Online"
        }).catch(() => null);
      }
    }

    // Fallback: pick any manager from Staff or User
    if (!managerProfile) {
      managerProfile = await Staff.findOne({ category: "manager" }).catch(() => null);
      if (!managerProfile) {
        const anyManagerUser = await User.findOne({ role: "manager" }).catch(() => null);
        if (anyManagerUser) {
          managerProfile = await Staff.create({
            name: anyManagerUser.name || "Sales Manager",
            email: anyManagerUser.email,
            role: "Sales Manager",
            category: "manager",
            avatar: anyManagerUser.avatar || "",
            department: "Sales Management",
            monthlyQuota: 100000,
            status: "Online"
          }).catch(() => null);
        }
      }
    }

    if (!managerProfile) {
      return res.status(404).json({
        success: false,
        error: "Manager profile not found in database"
      });
    }

    const companyFilter = getCompanyQuery(req);

    // 1. Fetch real active agents from Staff and User
    let staffAgents = [];
    const staffAgentsQuery = Staff.find({
      ...companyFilter,
      category: { $ne: "manager" }
    });
    if (staffAgentsQuery && typeof staffAgentsQuery.sort === "function") {
      staffAgents = (await staffAgentsQuery.sort({ createdAt: -1 })) || [];
    } else if (staffAgentsQuery) {
      staffAgents = (await staffAgentsQuery) || [];
    }

    // Populate active leads count for each agent strictly from database
    const agents = Array.isArray(staffAgents)
      ? await Promise.all(
          staffAgents.map(async (agent) => {
            const agentObj = typeof agent?.toObject === "function" ? agent.toObject() : agent;
            const userRecord = agent?.email
              ? await User.findOne({ email: agent.email.toLowerCase().trim() }).catch(() => null)
              : null;
            const queryOr = [{ assignedAgent: agent?._id }];
            if (userRecord?._id) queryOr.push({ assignedAgent: userRecord._id });

            const leadCount = (await Lead.countDocuments({ ...companyFilter, $or: queryOr }).catch(() => 0)) || 0;
            return {
              ...agentObj,
              userId: userRecord?._id || agent?._id,
              activeLeadsCount: leadCount
            };
          })
        )
      : [];

    const safeFindLeads = async (filter) => {
      try {
        const q = Lead.find(filter);
        if (q && typeof q.populate === "function") {
          const pop = q.populate("assignedAgent", "name email role avatar");
          if (pop && typeof pop.sort === "function") return (await pop.sort({ createdAt: -1 })) || [];
          return (await pop) || [];
        }
        if (q && typeof q.sort === "function") return (await q.sort({ createdAt: -1 })) || [];
        return (await q) || [];
      } catch {
        return [];
      }
    };

    // 2. Fetch real unassigned leads from Home page form (assignedAgent is null or status is 'New')
    const unassignedLeads = await safeFindLeads({
      ...companyFilter,
      $or: [
        { assignedAgent: null },
        { assignedAgent: { $exists: false } },
        { status: "New" }
      ]
    });

    // 3. Fetch all property leads for comprehensive visibility
    const allLeads = await safeFindLeads(companyFilter);

    // 4. Real Database Summary Counts
    const totalLeadsCount = (await Lead.countDocuments(companyFilter).catch(() => 0)) || 0;
    const unassignedCount = unassignedLeads.length;
    const assignedCount = Math.max(0, totalLeadsCount - unassignedCount);
    const newCount = (await Lead.countDocuments({ ...companyFilter, status: "New" }).catch(() => 0)) || 0;
    const inProgressCount =
      (await Lead.countDocuments({
        ...companyFilter,
        status: { $in: ["Contacted", "In Progress", "Site Visit Scheduled"] }
      }).catch(() => 0)) || 0;
    const siteVisitsCount =
      (await Lead.countDocuments({ ...companyFilter, status: "Site Visit Scheduled" }).catch(() => 0)) || 0;
    const dealsClosedCount =
      (await Lead.countDocuments({ ...companyFilter, status: { $in: ["Deal Closed", "Closed"] } }).catch(() => 0)) || 0;

    // Lead status distribution for the clean overview chart
    const leadStatusDistribution = [
      { name: "New Leads", count: newCount, fill: "#8b5cf6" },
      { name: "In Progress", count: inProgressCount, fill: "#3b82f6" },
      { name: "Site Visits", count: siteVisitsCount, fill: "#f59e0b" },
      { name: "Deals Closed", count: dealsClosedCount, fill: "#10b981" }
    ];

    const totalTeamClosedValue = agents.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    let activeDealsCount = 0;
    try {
      activeDealsCount = (await Deal.countDocuments(companyFilter)) || 0;
    } catch {
      activeDealsCount = 0;
    }

    let pendingApprovalsCount = 0;
    try {
      pendingApprovalsCount = (await Notification.countDocuments({ isRead: false })) || 0;
    } catch {
      pendingApprovalsCount = 0;
    }

    let companyRecord = null;
    let industryPolicy = null;
    if (companyFilter.company) {
      companyRecord = await Company.findById(companyFilter.company).catch(() => null);
      if (companyRecord && typeof companyRecord.getIndustryPolicy === "function") {
        industryPolicy = companyRecord.getIndustryPolicy();
      }
    }

    return res.status(200).json({
      success: true,
      company: companyRecord
        ? {
            id: companyRecord._id,
            name: companyRecord.companyName,
            slug: companyRecord.companySlug,
            industry: companyRecord.businessType,
            industryType: companyRecord.businessType
          }
        : null,
      industryPolicy,
      manager: managerProfile
        ? {
            id: managerProfile._id,
            _id: managerProfile._id,
            name: managerProfile.name,
            email: managerProfile.email,
            role: managerProfile.role,
            department: managerProfile.department,
            avatar: managerProfile.avatar || "",
            phone: managerProfile.phone || ""
          }
        : {
            name: req.user?.name || "Manager",
            email: req.user?.email || "manager@crm.com",
            role: "manager"
          },
      stats: {
        teamTargetProgress: {
          raw: totalTeamClosedValue,
          formatted: `$${totalTeamClosedValue.toLocaleString()}`,
          target: `$${(managerProfile?.monthlyQuota || 100000).toLocaleString()}`,
          percentage: 75
        },
        unassignedLeads: {
          raw: unassignedCount,
          formatted: `${unassignedCount} Leads`,
          count: unassignedCount
        },
        activeTeamDeals: {
          raw: activeDealsCount,
          formatted: `${activeDealsCount} Deals`,
          count: activeDealsCount
        },
        pendingApprovals: {
          raw: pendingApprovalsCount,
          formatted: `${pendingApprovalsCount} Pending`,
          count: pendingApprovalsCount
        },
        totalLeads: totalLeadsCount,
        assignedLeads: assignedCount,
        activeAgents: agents.length,
        newLeads: newCount,
        inProgressLeads: inProgressCount,
        siteVisitsScheduled: siteVisitsCount,
        dealsClosed: dealsClosedCount
      },
      leadStatusDistribution,
      agents,
      unassignedLeads,
      allLeads
    });
  } catch (error) {
    console.error("Manager Dashboard Error:", error);
    return res.status(500).json({ error: "Failed to load manager dashboard" });
  }
};

// PUT /api/manager/leads/:leadId/assign
export const assignLeadToAgent = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { agentId, assignedAgent } = req.body;
    const targetAgentId = agentId || assignedAgent;

    if (!targetAgentId) return res.status(400).json({ error: "Agent ID is required" });

    // Look up agent in User model or Staff model
    let agentUser = null;
    let agentStaff = await Staff.findById(targetAgentId).catch(() => null);
    if (!agentStaff && mongoose.Types.ObjectId.isValid(targetAgentId)) {
      agentUser = await User.findById(targetAgentId).catch(() => null);
    } else if (agentStaff?.email) {
      agentUser = await User.findOne({ email: agentStaff.email.toLowerCase().trim() }).catch(() => null);
    }

    if (!agentUser && !agentStaff) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const assignedId = agentStaff ? agentStaff._id : agentUser._id;
    const agentDisplayName = agentStaff?.name || agentUser?.name || "Agent";

    const updateQuery = Lead.findByIdAndUpdate(
      leadId,
      { assignedTo: assignedId, status: "Contacted" },
      { new: true }
    );
    const lead =
      updateQuery && typeof updateQuery.populate === "function"
        ? await updateQuery.populate("assignedAgent", "name email role avatar")
        : await updateQuery;

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const leadDisplayName = lead.clientName || lead.name || "Lead";
    await Activity.create({
      title: `Lead Assigned: ${leadDisplayName}`,
      description: `Lead '${leadDisplayName}' assigned to agent ${agentDisplayName}`,
      type: "lead",
      user: req.user?.email || "Manager",
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Lead assigned to ${agentDisplayName}`,
      lead,
      assignedTo: { name: agentDisplayName, id: assignedId }
    });
  } catch (error) {
    console.error("Assign Lead Error:", error);
    return res.status(500).json({ error: "Failed to assign lead" });
  }
};

// POST /api/manager/notifications/:id/approval
export const handleApprovalAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action = "approve", notes = "" } = req.body;
    const isApproved = String(action).toLowerCase() === "approve";

    const updated = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    await Activity.create({
      title: isApproved ? "Approval Request Approved" : "Approval Request Rejected",
      description: notes || `Manager performed '${action}' action on approval item.`,
      type: "deal",
      user: req.user?.email || "Manager",
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: isApproved
        ? "Approval request successfully approved!"
        : "Approval request was declined.",
      notification: updated
    });
  } catch (error) {
    console.error("Handle Approval Error:", error);
    return res.status(500).json({ error: "Failed to process approval action" });
  }
};

// GET /api/manager/agents
export const getManagerAgents = async (req, res) => {
  try {
    const agents = await Staff.find({
      category: { $ne: "manager" }
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: agents.length, agents });
  } catch (error) {
    console.error("Get Agents Error:", error);
    return res.status(500).json({ error: "Failed to load sales agents" });
  }
};

// POST /api/manager/agents
// Manager manually creates Agent accounts (User + Staff)
export const addSalesAgentOrStaff = async (req, res) => {
  try {
    const { name, email, role, phone, password } = req.body;

    if (!name || !name.trim() || !email || !email.trim()) {
      return res.status(400).json({ error: "Agent Name and Email are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists in Staff
    const existingStaff = await Staff.findOne({ email: cleanEmail });
    if (existingStaff) {
      return res.status(400).json({ error: `An agent with email '${cleanEmail}' already exists in your team` });
    }

    // Check if email already exists in User as non-agent
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.role !== "agent") {
      return res.status(400).json({
        error: `This email is already registered as a ${existingUser.role}. Please use a separate agent email address.`
      });
    }

    const managerEmail = req.user?.email || "Manager";
    const managerId = req.user?.userId && mongoose.Types.ObjectId.isValid(req.user.userId)
      ? req.user.userId
      : null;
    const targetCompanyId = req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId)
      ? req.user.companyId
      : null;

    const newAgent = await Staff.create({
      name: name.trim(),
      email: cleanEmail,
      role: role?.trim() || "Real Estate Agent",
      category: "agent",
      company: targetCompanyId,
      phone: phone?.trim() || "",
      dealsClosed: 0,
      totalValue: 0,
      status: "Online",
      department: "Property Sales",
      managerEmail: managerEmail.toLowerCase().trim(),
      managerId
    });

    const defaultPassword = password?.trim() || "Agent@1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let createdUser;
    if (!existingUser) {
      createdUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: "agent",
        company: targetCompanyId,
        isVerified: true
      });
    } else {
      existingUser.name = name.trim();
      existingUser.role = "agent";
      existingUser.password = hashedPassword;
      if (targetCompanyId) existingUser.company = targetCompanyId;
      await existingUser.save();
      createdUser = existingUser;
    }

    await Activity.create({
      title: `Manager added new Agent: ${newAgent.name}`,
      description: `Role: ${newAgent.role} | Added by ${managerEmail}`,
      type: "staff",
      user: managerEmail,
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Sales Agent created successfully",
      agent: {
        ...(typeof newAgent?.toObject === "function" ? newAgent.toObject() : newAgent),
        userId: createdUser._id,
        activeLeadsCount: 0
      }
    });
  } catch (error) {
    console.error("Add Agent Error:", error);
    return res.status(500).json({ error: error.message || "Failed to add agent" });
  }
};

// DELETE /api/manager/agents/:id
export const deleteSalesAgentOrStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Staff.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (deleted.email) {
      await User.findOneAndDelete({ email: deleted.email.toLowerCase().trim() }).catch(() => {});
    }

    await Activity.create({
      title: `Agent removed: ${deleted.name}`,
      description: `${deleted.role} (${deleted.email}) removed from active team`,
      type: "staff",
      user: req.user?.email || "Manager",
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Agent removed successfully"
    });
  } catch (error) {
    console.error("Delete Agent Error:", error);
    return res.status(500).json({ error: "Failed to delete agent" });
  }
};
