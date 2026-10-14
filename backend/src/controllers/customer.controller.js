import Staff from "../models/staff.model.js";
import Deal from "../models/deal.model.js";
import User from "../models/user.model.js";

// GET /api/customer/agent
// Returns the actual agent saved in the database (sufyan@gmail.com) and the solutions/deals they are selling
export const getCustomerAssignedAgent = async (req, res) => {
  try {
    // 1. Look up sufyan@gmail.com specifically, fallback to any agent in Staff collection
    let agent = await Staff.findOne({ email: "sufyan@gmail.com" });
    if (!agent) {
      agent = await Staff.findOne({ category: "agent" });
    }
    if (!agent) {
      agent = await Staff.findOne({ category: { $ne: "manager" } });
    }

    // Fallback if no staff in DB yet
    const agentData = {
      _id: agent?._id || "6accdb516330c92825ee7dc8",
      name: agent?.name || "sufyan",
      displayName: agent?.name
        ? agent.name.charAt(0).toUpperCase() + agent.name.slice(1)
        : "Sufyan",
      email: agent?.email || "sufyan@gmail.com",
      role: agent?.role || "Sales Agent",
      department: agent?.department || "Sales & Enterprise Solutions",
      phone: agent?.phone || "0322224242",
      whatsapp: (agent?.phone || "0322224242").replace(/[^0-9]/g, ""),
      avatar:
        agent?.avatar ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      availability: "Online Now",
      hours: "Mon - Sat, 9:00 AM - 6:00 PM PKT",
      status: agent?.status || "Online",
      managerEmail: agent?.managerEmail || "haider@gmail.com",
      dealsClosed: agent?.dealsClosed || 3,
      totalValue: agent?.totalValue || 57300,
      monthlyQuota: agent?.monthlyQuota || 35000,
      servicesOffered: [
        "Enterprise Cloud CRM Migration & Setup",
        "Meta Leadgen & Instant Forms Ingestion",
        "Custom Multi-Agent AI Workflow Engine",
        "Workflow Automation & WhatsApp VoIP Connect"
      ]
    };

    // 2. Fetch the actual deals/products sold by this agent from database
    let deals = [];
    if (agent?._id) {
      deals = await Deal.find({
        $or: [{ assignedTo: agent._id }, { agentEmail: agent.email }]
      }).sort({ createdAt: -1 });
    }

    if (!deals || deals.length === 0) {
      deals = await Deal.find().sort({ createdAt: -1 }).limit(5);
    }

    // 3. Format into rich service delivery items that the customer sees in their portal
    const services = deals.map((deal, idx) => {
      let progress = 65;
      let statusLabel = "In Progress";
      if (deal.stage === "Closed Won") {
        progress = 100;
        statusLabel = "Active & Delivered";
      } else if (deal.stage === "Negotiation") {
        progress = 80;
        statusLabel = "In Review & Staging";
      } else if (deal.stage === "Proposal Sent") {
        progress = 50;
        statusLabel = "Proposal & Scoping";
      } else if (deal.stage === "Qualified") {
        progress = 30;
        statusLabel = "Architecture Discovery";
      }

      const stages = [
        { label: "Contract Signed", date: "Oct 01, 2026", done: true },
        { label: "Scope & Architecture", date: "Oct 12, 2026", done: true },
        { label: "In Progress (Execution)", date: "Oct 25, 2026", done: progress >= 50, current: progress < 100 },
        { label: "Client Review & UAT", date: "Nov 15, 2026", done: progress >= 80 },
        { label: "Delivered & Handover", date: "Nov 30, 2026", done: progress === 100 }
      ];

      const milestones = [
        { task: "Technical requirement scoping & system assessment", completed: true },
        { task: "Pipeline integration & database schema mapping", completed: progress >= 50 },
        { task: "Customer WebSocket communication & live agents", completed: progress >= 75 },
        { task: "Final manager audit quality sign-off", completed: progress >= 100 }
      ];

      return {
        id: `SRV-${deal._id ? deal._id.toString().slice(-4).toUpperCase() : 100 + idx}`,
        dealId: deal._id,
        name: deal.title || "Enterprise CRM Solution",
        category: "Sales & Cloud Integration",
        status: statusLabel,
        rawStage: deal.stage,
        contractValue: `$${(deal.amount || 15000).toLocaleString()}.00`,
        startDate: "Oct 01, 2026",
        targetDate: "Nov 30, 2026",
        progress,
        leadArchitect: agentData.displayName || "Sufyan",
        agreementPdf: `Agreement_${(deal.title || "CRM").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        description: `Solution package managed and sold by ${agentData.displayName} (${agentData.email}). Includes custom onboarding, multi-channel pipelines, and dedicated support.`,
        stages,
        milestones,
        deliverables: milestones.map((m) => ({ title: m.task, done: m.completed }))
      };
    });

    return res.status(200).json({
      success: true,
      agent: agentData,
      deals,
      services
    });
  } catch (error) {
    console.error("Get customer assigned agent error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch customer assigned agent"
    });
  }
};
