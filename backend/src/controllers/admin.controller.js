import Staff from "../models/staff.model.js";
import Lead from "../models/lead.model.js";
import Deal from "../models/deal.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const getAdminOverview = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const unassignedLeads = await Lead.countDocuments({
      $or: [
        { assignedAgent: null },
        { assignedAgent: { $exists: false } },
        { status: "New" }
      ]
    });
    const assignedLeads = Math.max(0, totalLeads - unassignedLeads);

    const totalManagers = await Staff.countDocuments({ category: "manager" });
    const totalAgents = await Staff.countDocuments({ category: { $ne: "manager" } });

    const newLeads = await Lead.countDocuments({ status: "New" });
    const inProgressLeads = await Lead.countDocuments({
      status: { $in: ["Contacted", "In Progress", "Site Visit Scheduled"] }
    });
    const siteVisitsScheduled = await Lead.countDocuments({ status: "Site Visit Scheduled" });
    const dealsClosed = await Lead.countDocuments({
      status: { $in: ["Deal Closed", "Closed"] }
    });

    const leadStatusDistribution = [
      { name: "New Leads", count: newLeads, fill: "#8b5cf6" },
      { name: "In Progress", count: inProgressLeads, fill: "#3b82f6" },
      { name: "Site Visits", count: siteVisitsScheduled, fill: "#f59e0b" },
      { name: "Deals Closed", count: dealsClosed, fill: "#10b981" }
    ];

    let managers = [];
    const staffQuery = Staff.find({ category: "manager" });
    if (staffQuery && typeof staffQuery.sort === "function") {
      managers = (await staffQuery.sort({ createdAt: -1 })) || [];
    } else if (staffQuery) {
      managers = (await staffQuery) || [];
    }

    let recentLeads = [];
    const leadQuery = Lead.find();
    if (leadQuery && typeof leadQuery.populate === "function") {
      const populated = leadQuery.populate("assignedAgent", "name email role avatar");
      recentLeads =
        populated && typeof populated.sort === "function"
          ? (await populated.sort({ createdAt: -1 }).limit(20)) || []
          : (await populated) || [];
    } else if (leadQuery && typeof leadQuery.sort === "function") {
      recentLeads = (await leadQuery.sort({ createdAt: -1 }).limit(20)) || [];
    } else if (leadQuery) {
      recentLeads = (await leadQuery) || [];
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalLeads,
        unassignedLeads,
        assignedLeads,
        totalManagers,
        totalAgents,
        newLeads,
        inProgressLeads,
        siteVisitsScheduled,
        dealsClosed
      },
      leadStatusDistribution,
      managers,
      recentLeads
    });
  } catch (error) {
    console.error("Admin Overview Error:", error);
    return res.status(500).json({ error: "Failed to fetch admin overview statistics" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalStaffCount = (await Staff.countDocuments().catch(() => 0)) || 0;
    const liveLeadsCount = (await Lead.countDocuments().catch(() => 0)) || 0;
    const liveDealsCount = (await Deal.countDocuments().catch(() => 0)) || 0;

    const wonDealsAgg = await Deal.aggregate([
      { $match: { stage: "Closed Won" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).catch(() => []);
    const liveWonDealsSum = (Array.isArray(wonDealsAgg) && wonDealsAgg[0]?.total) || 0;

    const staffAgg = await Staff.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$totalValue" },
          totalDeals: { $sum: "$dealsClosed" },
          avgSuccessRate: { $avg: "$successRate" }
        }
      }
    ]).catch(() => []);
    const staffTotalClosed = (Array.isArray(staffAgg) && staffAgg[0]?.totalValue) || 0;

    const totalRevenue = liveWonDealsSum;
    const totalLeads = liveLeadsCount;
    const activeDeals = liveDealsCount;
    const conversionRate = 24.8;

    const sourceBreakdown = await Lead.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]).catch(() => []);

    const defaultLeadSources = [
      { name: "Organic Website", value: 0, color: "#7c3aed" },
      { name: "Facebook & Social Ads", value: 0, color: "#38bdf8" },
      { name: "Client Referrals", value: 0, color: "#10b981" },
      { name: "Cold Outreach & Email", value: 0, color: "#f59e0b" }
    ];

    if (Array.isArray(sourceBreakdown)) {
      sourceBreakdown.forEach((item) => {
        if (!item?._id) return;
        const found = defaultLeadSources.find((s) => s.name === item._id);
        if (found) {
          found.value = item.count;
        } else {
          defaultLeadSources.push({
            name: item._id,
            value: item.count,
            color: "#6366f1"
          });
        }
      });
    }

    const monthlyRevenueBaseline = [
      { month: "Jan", revenue: 42000, target: 35000, deals: 32 },
      { month: "Feb", revenue: 56000, target: 45000, deals: 44 },
      { month: "Mar", revenue: 51000, target: 48000, deals: 39 },
      { month: "Apr", revenue: 68000, target: 58000, deals: 52 },
      { month: "May", revenue: 79000, target: 65000, deals: 61 },
      { month: "Jun", revenue: 74000, target: 70000, deals: 58 },
      { month: "Jul", revenue: 89000, target: 75000, deals: 71 },
      { month: "Aug", revenue: 98000, target: 82000, deals: 77 },
      { month: "Sep", revenue: 112000, target: 90000, deals: 84 },
      { month: "Oct", revenue: 128450, target: 95000, deals: 96 }
    ];

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue: {
          raw: totalRevenue,
          formatted: `$${totalRevenue.toLocaleString()}`,
          change: "+12.5%",
          label: "vs last month"
        },
        totalLeads: {
          raw: totalLeads,
          formatted: totalLeads.toLocaleString(),
          change: "+8.2%",
          label: "monthly increase"
        },
        activeDeals: {
          raw: activeDeals,
          formatted: `${activeDeals} deals`,
          label: "active in pipeline"
        },
        conversionRate: {
          raw: conversionRate,
          formatted: `${conversionRate}%`,
          change: "+2.1%",
          label: "overall win rate"
        }
      },
      summary: {
        totalStaff: totalStaffCount,
        staffClosedValue: staffTotalClosed
      },
      revenueGrowth: monthlyRevenueBaseline,
      leadSources: defaultLeadSources
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

// Staff Controller Endpoints (Retrieves agents/staff from database)
export const getStaffList = async (req, res) => {
  try {
    const staff = await Staff.find({ category: { $ne: "manager" } }).sort({ totalValue: -1, createdAt: -1 });
    return res.status(200).json({ success: true, count: staff.length, staff });
  } catch (error) {
    console.error("Staff List Error:", error);
    return res.status(500).json({ error: "Failed to fetch staff members" });
  }
};

export const addStaffMember = async (req, res) => {
  return res.status(403).json({
    success: false,
    error: "Admins are restricted from creating agents. Admins can only create Managers from their dashboard. Agents are managed directly by Managers."
  });
};


export const deleteStaffMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Staff.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    await Activity.create({
      title: `Staff member removed: ${deleted.name}`,
      description: `Staff profile for ${deleted.email} was deactivated.`,
      type: "staff",
      user: req.user?.email || "Admin",
      timeAgo: "Just now"
    });

    return res.status(200).json({ success: true, message: "Staff member removed successfully" });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    return res.status(500).json({ error: "Failed to delete staff member" });
  }
};

// Super Admin: Manager Management Endpoints
export const addManager = async (req, res) => {
  try {
    const { name, email, phone, role, monthlyQuota, department, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existing = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "A manager or staff with this email already exists" });
    }

    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newManager = await Staff.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role || "Sales Manager",
      category: "manager",
      avatar: randomAvatar,
      monthlyQuota: monthlyQuota ? Number(monthlyQuota) : 100000,
      phone: phone || "",
      department: department || "Sales Management",
      dealsClosed: 0,
      totalValue: 0,
      successRate: 90,
      status: "Online"
    });

    // Create or update User with role 'manager' so they can log in
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!existingUser) {
      const defaultPassword = password || "Manager@1234";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "manager",
        isVerified: true,
        avatar: randomAvatar
      });
    } else {
      existingUser.role = "manager";
      if (password) {
        existingUser.password = await bcrypt.hash(password, 10);
      }
      await existingUser.save();
    }

    await Activity.create({
      title: `Super Admin added Manager: ${newManager.name}`,
      description: `Role: ${newManager.role} | Department: ${newManager.department}`,
      type: "staff",
      user: req.user?.email || "Super Admin",
      timeAgo: "Just now"
    });

    return res.status(201).json({
      success: true,
      message: "Manager created successfully with Manager Dashboard access",
      manager: newManager
    });
  } catch (error) {
    console.error("Add Manager Error:", error);
    return res.status(500).json({ error: "Failed to add manager" });
  }
};

export const getManagers = async (req, res) => {
  try {
    const managers = await Staff.find({ category: "manager" }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: managers.length, managers });
  } catch (error) {
    console.error("Get Managers Error:", error);
    return res.status(500).json({ error: "Failed to fetch managers" });
  }
};

export const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Staff.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Manager not found" });
    }

    if (deleted.email) {
      await User.findOneAndDelete({ email: deleted.email.toLowerCase().trim() }).catch(() => {});
    }

    await Activity.create({
      title: `Manager removed: ${deleted.name}`,
      description: `Manager profile (${deleted.email}) was removed by Super Admin.`,
      type: "staff",
      user: req.user?.email || "Super Admin",
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(200).json({ success: true, message: "Manager removed successfully" });
  } catch (error) {
    console.error("Delete Manager Error:", error);
    return res.status(500).json({ error: "Failed to delete manager" });
  }
};

// Activities Controller Endpoints
export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(20);
    return res.status(200).json({ success: true, count: activities.length, activities });
  } catch (error) {
    console.error("Activities Error:", error);
    return res.status(500).json({ error: "Failed to fetch activities" });
  }
};

export const addActivity = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const activity = await Activity.create({
      title,
      description: description || "",
      type: type || "system",
      user: req.user?.email || "Admin",
      timeAgo: "Just now"
    });
    return res.status(201).json({ success: true, activity });
  } catch (error) {
    console.error("Add Activity Error:", error);
    return res.status(500).json({ error: "Failed to record activity" });
  }
};

// Notifications Controller Endpoints
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    return res.status(200).json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error("Notifications Error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return res.status(500).json({ error: "Failed to update notifications" });
  }
};

// Leads CRUD Endpoints
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate("assignedTo", "name email").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: leads.length, leads });
  } catch (error) {
    console.error("Get Leads Error:", error);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
};

export const createLead = async (req, res) => {
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
      notes,
      note,
      assignedAgent,
      agentId,
      status = "New"
    } = req.body;

    const resolvedName = (clientName || name || "").trim();
    const resolvedEmail = (email || "").toLowerCase().trim();
    const resolvedRequirements = (requirements || message || "").trim();

    if (!resolvedName || !resolvedEmail) {
      return res.status(400).json({ error: "Name and email are required for a lead" });
    }

    let resolvedAgentId = null;
    const targetAgentId = assignedAgent || agentId;
    if (targetAgentId && targetAgentId !== "unassigned") {
      if (mongoose.Types.ObjectId.isValid(targetAgentId)) {
        resolvedAgentId = targetAgentId;
      }
    }

    const initialNotes = [];
    const noteText = (typeof note === "string" ? note : (notes || "")).trim();
    if (noteText) {
      initialNotes.push({ text: noteText, date: new Date() });
    }

    const lead = await Lead.create({
      clientName: resolvedName,
      name: resolvedName,
      email: resolvedEmail,
      phone: phone || "",
      requirements: resolvedRequirements,
      message: resolvedRequirements,
      budget: budget || "",
      propertyType: propertyType || "Residential",
      company: company || "Individual Client",
      source: source || "Direct Call",
      status: status || "New",
      assignedAgent: resolvedAgentId,
      estimatedValue: Number(estimatedValue) || 0,
      notes: initialNotes
    });

    await Activity.create({
      title: `New lead created: ${lead.clientName}`,
      description: `${lead.company} (${lead.source}) - Est. Value $${lead.estimatedValue.toLocaleString()}`,
      type: "lead",
      user: req.user?.email || "Admin",
      timeAgo: "Just now"
    }).catch(() => {});

    return res.status(201).json({ success: true, lead });
  } catch (error) {
    console.error("Create Lead Error:", error);
    return res.status(500).json({ error: "Failed to create lead" });
  }
};

// Deals CRUD Endpoints
export const getDeals = async (req, res) => {
  try {
    const deals = await Deal.find().populate("lead", "name company").populate("assignedTo", "name email").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: deals.length, deals });
  } catch (error) {
    console.error("Get Deals Error:", error);
    return res.status(500).json({ error: "Failed to fetch deals" });
  }
};

export const createDeal = async (req, res) => {
  try {
    const { title, amount, stage, probability, month } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ error: "Title and amount are required for a deal" });
    }
    const deal = await Deal.create({
      title,
      amount: Number(amount),
      stage: stage || "Prospecting",
      probability: Number(probability) || 50,
      month: month || "Oct"
    });

    await Activity.create({
      title: `New Deal registered: ${deal.title}`,
      description: `Valued at $${deal.amount.toLocaleString()} in ${deal.stage} stage`,
      type: "deal",
      user: req.user?.email || "Admin",
      timeAgo: "Just now"
    });

    return res.status(201).json({ success: true, deal });
  } catch (error) {
    console.error("Create Deal Error:", error);
    return res.status(500).json({ error: "Failed to create deal" });
  }
};

// CSV Export Endpoint
export const exportCsvReport = async (req, res) => {
  try {
    const staff = await Staff.find().lean();
    const leads = await Lead.find().lean();
    const deals = await Deal.find().lean();

    let csvContent = "";

    // Section 1: Team Members
    csvContent += "=== TEAM PERFORMANCE ===\n";
    csvContent += "ID,Name,Email,Role,Deals Closed,Total Value ($),Success Rate (%),Status\n";
    staff.forEach((s) => {
      csvContent += `"${s._id}","${s.name}","${s.email}","${s.role}",${s.dealsClosed},${s.totalValue},${s.successRate}%,"${s.status}"\n`;
    });

    csvContent += "\n=== LEADS SUMMARY ===\n";
    csvContent += "Name,Email,Company,Source,Status,Estimated Value ($)\n";
    leads.forEach((l) => {
      csvContent += `"${l.name}","${l.email}","${l.company}","${l.source}","${l.status}",${l.estimatedValue}\n`;
    });

    csvContent += "\n=== DEALS PIPELINE ===\n";
    csvContent += "Title,Amount ($),Stage,Probability (%),Month\n";
    deals.forEach((d) => {
      csvContent += `"${d.title}",${d.amount},"${d.stage}",${d.probability}%,"${d.month || ''}"\n`;
    });

    const filename = `crm-admin-report-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("CSV Export Error:", error);
    return res.status(500).json({ error: "Failed to generate CSV export" });
  }
};
