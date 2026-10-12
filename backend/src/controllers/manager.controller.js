import Staff from "../models/staff.model.js";
import Deal from "../models/deal.model.js";
import Lead from "../models/lead.model.js";
import Activity from "../models/activity.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

// GET /api/manager/dashboard
// Strictly what is necessary for the Manager: Team KPIs, Team Agents, and Active Team Deals
export const getManagerDashboard = async (req, res) => {
  try {
    const managerEmail = req.user?.email || "";

    // 1. Fetch Sales Agents & Staff (anyone who is not a manager)
    let query = { category: { $ne: "manager" } };
    if (managerEmail && req.user?.role === "manager") {
      query = {
        category: { $ne: "manager" },
        $or: [
          { managerEmail: managerEmail.toLowerCase() },
          { managerEmail: "" },
          { managerEmail: { $exists: false } }
        ]
      };
    }

    const agents = await Staff.find(query).sort({ totalValue: -1, createdAt: -1 });

    // 2. Aggregate Team Metrics
    const totalAgentsCount = agents.length;
    const totalTeamClosedValue = agents.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    const totalTeamDeals = agents.reduce((acc, curr) => acc + (curr.dealsClosed || 0), 0);
    const avgWinRate = totalAgentsCount > 0
      ? Math.round(agents.reduce((acc, curr) => acc + (curr.successRate || 80), 0) / totalAgentsCount)
      : 84;
    const totalTeamQuota = agents.reduce((acc, curr) => acc + (curr.monthlyQuota || 40000), 0) || 150000;

    // 3. Active Deals for the Team
    const recentDeals = await Deal.find()
      .populate("lead", "name company")
      .sort({ createdAt: -1 })
      .limit(6);

    const activeDealsCount = await Deal.countDocuments({
      stage: { $in: ["Prospecting", "Qualified", "Proposal Sent", "Negotiation"] }
    }) || 18;

    return res.status(200).json({
      success: true,
      stats: {
        teamAgents: {
          value: totalAgentsCount,
          formatted: `${totalAgentsCount} Active Members`,
          label: "Sales Reps & Support Staff"
        },
        activeDeals: {
          value: activeDealsCount,
          formatted: `${activeDealsCount} Deals`,
          label: "In Active Pipeline"
        },
        teamRevenue: {
          value: totalTeamClosedValue || 112600,
          formatted: `$${(totalTeamClosedValue || 112600).toLocaleString()}`,
          target: `$${totalTeamQuota.toLocaleString()}`,
          label: "Monthly Quota Progress"
        },
        teamWinRate: {
          value: avgWinRate,
          formatted: `${avgWinRate}%`,
          label: "Average Success Rate"
        }
      },
      agents,
      recentDeals
    });
  } catch (error) {
    console.error("Manager Dashboard Error:", error);
    return res.status(500).json({ error: "Failed to load manager dashboard" });
  }
};

// GET /api/manager/agents
// List Sales Agents and Staff
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
// Permission: Managers can ONLY add Sales Agents and Staff (not managers or admins)
export const addSalesAgentOrStaff = async (req, res) => {
  try {
    const { name, email, role, category, phone, monthlyQuota, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Agent Name and Email are required" });
    }

    // Strict validation: Manager can only add agent or staff
    const assignedCategory = category === "staff" ? "staff" : "agent";
    const assignedRole = role || (assignedCategory === "staff" ? "Support Staff" : "Sales Agent");

    // Check if staff email already exists
    const existingStaff = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existingStaff) {
      return res.status(400).json({ error: "A team member with this email already exists" });
    }

    // Default agent avatars
    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
    ];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const managerEmail = req.user?.email || "Manager";
    const managerId = req.user?.userId || null;

    // Create staff document
    const newAgent = await Staff.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: assignedRole,
      category: assignedCategory,
      avatar,
      phone: phone || "",
      monthlyQuota: monthlyQuota ? Number(monthlyQuota) : 35000,
      dealsClosed: 0,
      totalValue: 0,
      successRate: 85,
      status: "Online",
      department: assignedCategory === "staff" ? "Operations & Support" : "Sales",
      managerEmail: managerEmail.toLowerCase().trim(),
      managerId
    });

    // Optionally create or update User login account for the agent so they can sign in
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!existingUser) {
      const defaultPassword = password || "Agent@1234";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: assignedCategory === "staff" ? "staff" : "agent",
        isVerified: true,
        avatar
      });
    } else {
      existingUser.name = name.trim();
      existingUser.role = assignedCategory === "staff" ? "staff" : "agent";
      if (password) {
        existingUser.password = await bcrypt.hash(password, 10);
      }
      await existingUser.save();
    }

    // Log Activity
    await Activity.create({
      title: `Manager added new ${assignedCategory === "staff" ? "Staff" : "Sales Agent"}: ${newAgent.name}`,
      description: `Role: ${newAgent.role} | Added by ${managerEmail}`,
      type: "staff",
      user: managerEmail,
      timeAgo: "Just now"
    });

    return res.status(201).json({
      success: true,
      message: `${assignedCategory === "staff" ? "Staff member" : "Sales Agent"} created successfully`,
      agent: newAgent
    });
  } catch (error) {
    console.error("Add Agent Error:", error);
    return res.status(500).json({ error: "Failed to add sales agent or staff" });
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

    await Activity.create({
      title: `Agent removed: ${deleted.name}`,
      description: `${deleted.role} (${deleted.email}) removed from active team`,
      type: "staff",
      user: req.user?.email || "Manager",
      timeAgo: "Just now"
    });

    return res.status(200).json({
      success: true,
      message: "Agent / Staff member removed successfully"
    });
  } catch (error) {
    console.error("Delete Agent Error:", error);
    return res.status(500).json({ error: "Failed to delete agent" });
  }
};
