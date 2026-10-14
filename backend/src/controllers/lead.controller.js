import Lead from "../models/lead.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";

/**
 * Normalizes acquisition source string to standard title case
 */
const normalizeSource = (src) => {
  if (!src) return "Website";
  const s = src.toLowerCase().trim();
  if (s === "facebook" || s.includes("facebook")) return "Facebook";
  if (s === "instagram" || s.includes("instagram")) return "Instagram";
  if (s === "linkedin" || s.includes("linkedin")) return "LinkedIn";
  if (s === "twitter" || s.includes("twitter") || s === "x") return "Twitter";
  if (s === "whatsapp" || s.includes("whatsapp")) return "WhatsApp";
  if (s === "website" || s.includes("website") || s.includes("organic")) return "Website";
  if (s === "referral" || s.includes("referral")) return "Referral";
  return src;
};

/**
 * 1. POST /api/leads/create
 * Manual Lead Entry Fallback (walk-in, offline, or phone call leads)
 */
export const createManualLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      source = "Website",
      estimatedValue = 0,
      notes = "",
      status = "New"
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Customer email address is required" });
    }

    const normalizedSource = normalizeSource(source);

    // Create lead in MongoDB
    const lead = await Lead.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      company: company && company.trim() ? company.trim() : "Individual Client",
      source: normalizedSource,
      status: status || "New",
      estimatedValue: Number(estimatedValue) || 0,
      notes: notes ? notes.trim() : "Added via Manual Lead Entry Fallback"
    });

    // Record activity log
    await Activity.create({
      title: `Manual Lead Added: ${lead.name}`,
      description: `Tagged source: ${lead.source} • Est. Value: $${lead.estimatedValue.toLocaleString()}`,
      type: "lead",
      user: req.user?.name || "Admin/Staff",
      timeAgo: "Just now"
    });

    // Record notification
    await Notification.create({
      title: `New Lead: ${lead.name}`,
      description: `Inbound lead added manually from ${lead.source}.`,
      type: "lead",
      isRead: false
    });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead
    });
  } catch (error) {
    console.error("Create Lead Error:", error);
    return res.status(500).json({
      error: "Failed to create manual lead",
      details: error.message
    });
  }
};

/**
 * 2. GET /api/leads/source-analytics
 * Aggregates lead counts, closed/won count, and conversion rate grouped by acquisition source using MongoDB $group
 */
export const getSourceAnalytics = async (req, res) => {
  try {
    // MongoDB Aggregation Pipeline using $group
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
                    ["converted", "closed won", "closed/won", "won", "closed"]
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

    // Color definitions for Recharts chart
    const channelColors = {
      Facebook: "#3b82f6",
      Instagram: "#ec4899",
      LinkedIn: "#0ea5e9",
      WhatsApp: "#10b981",
      Website: "#8b5cf6",
      "Organic Website": "#8b5cf6",
      Referral: "#f59e0b",
      "Client Referrals": "#f59e0b",
      "Facebook & Social Ads": "#38bdf8",
      "Cold Outreach & Email": "#f97316",
      Other: "#64748b"
    };

    // Calculate global summary totals
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
        value: item.totalLeads, // For Recharts pie/donut
        color: channelColors[srcName] || "#6366f1"
      };
    });

    const overallConversionRate =
      totalLeadsAll > 0
        ? Math.round((totalWonAll / totalLeadsAll) * 1000) / 10
        : 0;

    const topSource = formattedSources[0]?.source || "N/A";

    return res.status(200).json({
      success: true,
      sources: formattedSources,
      summary: {
        totalLeads: totalLeadsAll,
        closedWonCount: totalWonAll,
        overallConversionRate,
        totalPipelineValue: totalPipelineValueAll,
        topSource,
        channelsCount: formattedSources.length
      }
    });
  } catch (error) {
    console.error("Lead Source Analytics Error:", error);
    return res.status(500).json({
      error: "Failed to generate lead source analytics",
      details: error.message
    });
  }
};

/**
 * 3. GET /api/leads
 * Fetch all leads with optional search, source filter, and status filter
 */
export const getLeadsList = async (req, res) => {
  try {
    const { source, status, search, limit = 50 } = req.query;

    const query = {};

    if (source && source !== "all") {
      query.source = source;
    }

    if (status && status !== "all") {
      query.status = { $regex: new RegExp(`^${status}$`, "i") };
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { company: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } }
      ];
    }

    const leads = await Lead.find(query)
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
      error: "Failed to fetch leads list",
      details: error.message
    });
  }
};

/**
 * 4. POST /api/leads/simulate-webhook
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
      estimatedValue = 3500
    } = req.body;

    const mockLeadgenId = `sim_${Date.now()}`;
    const mockFormId = `form_${Math.floor(100000 + Math.random() * 900000)}`;

    const newLead = await Lead.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      company,
      source: normalizeSource(platform),
      status: "New",
      estimatedValue: Number(estimatedValue) || 3500,
      notes: `Captured via Simulated Meta Graph Webhook (Form: ${mockFormId})`,
      metaData: {
        leadgenId: mockLeadgenId,
        pageId: "page_sim_1001",
        formId: mockFormId,
        platform,
        rawFieldData: { simulated: true, timestamp: new Date().toISOString() }
      }
    });

    await Activity.create({
      title: `New ${newLead.source} Lead Ingested`,
      description: `${newLead.name} (${newLead.email}) submitted instant lead form`,
      type: "lead",
      user: "Meta Webhook Simulator",
      timeAgo: "Just now"
    });

    await Notification.create({
      title: `Instant ${newLead.source} Lead: ${newLead.name}`,
      description: `Inbound prospect captured from social ad campaign ($${newLead.estimatedValue.toLocaleString()}).`,
      type: "lead",
      isRead: false
    });

    return res.status(201).json({
      success: true,
      message: `Simulated ${newLead.source} lead ingested successfully!`,
      lead: newLead
    });
  } catch (error) {
    console.error("Simulate Webhook Error:", error);
    return res.status(500).json({
      error: "Failed to simulate Meta webhook lead",
      details: error.message
    });
  }
};
