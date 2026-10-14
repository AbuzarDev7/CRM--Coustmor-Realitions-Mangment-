import Staff from "../models/staff.model.js";
import Lead from "../models/lead.model.js";
import Deal from "../models/deal.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const seedDatabaseIfEmpty = async () => {
  try {
    const staffCount = await Staff.countDocuments();
    if (staffCount === 0) {
      console.log("🌱 Seeding initial Staff members...");
      await Staff.insertMany([
        {
          name: "Bilal Ahmed",
          email: "bilal.a@onesoft.com",
          role: "Senior Sales Exec",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          dealsClosed: 34,
          totalValue: 46200,
          successRate: 94,
          status: "Online",
          monthlyQuota: 50000,
          phone: "+92 300 1234567",
          department: "Enterprise Sales"
        },
        {
          name: "Sara Khan",
          email: "sara.k@onesoft.com",
          role: "Account Executive",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
          dealsClosed: 28,
          totalValue: 38900,
          successRate: 89,
          status: "In Meeting",
          monthlyQuota: 45000,
          phone: "+92 321 7654321",
          department: "Client Success"
        },
        {
          name: "Hamza Farooq",
          email: "hamza.f@onesoft.com",
          role: "Lead Generation Specialist",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
          dealsClosed: 24,
          totalValue: 27500,
          successRate: 82,
          status: "Online",
          monthlyQuota: 30000,
          phone: "+92 333 9876543",
          department: "Outreach"
        },
        {
          name: "Zoya Malik",
          email: "zoya.m@onesoft.com",
          role: "Enterprise Account Manager",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
          dealsClosed: 19,
          totalValue: 32400,
          successRate: 91,
          status: "Online",
          monthlyQuota: 40000,
          phone: "+92 345 1122334",
          department: "Enterprise Sales"
        },
        {
          name: "Tariq Mansoor",
          email: "tariq.m@onesoft.com",
          role: "Sales Representative",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
          dealsClosed: 15,
          totalValue: 14800,
          successRate: 76,
          status: "Offline",
          monthlyQuota: 25000,
          phone: "+92 312 9988776",
          department: "Inside Sales",
          category: "agent"
        }
      ]);
    }

    // Ensure default Admin exists for testing
    const existingAdmin = await User.findOne({ email: "admin@crm.com" });
    if (!existingAdmin) {
      console.log("🌱 Seeding default Admin user...");
      const hashedPassword = await bcrypt.hash("Admin@1234", 10);
      await User.create({
        name: "Super Admin",
        email: "admin@crm.com",
        password: hashedPassword,
        role: "admin",
        isVerified: true
      });
    }

    // Ensure at least one Manager exists for testing
    const managerCount = await Staff.countDocuments({ category: "manager" });
    if (managerCount === 0) {
      console.log("🌱 Seeding default Manager profile...");
      await Staff.create({
        name: "Imran Siddiqui",
        email: "manager@onesoft.com",
        role: "Regional Sales Manager",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
        dealsClosed: 42,
        totalValue: 84000,
        successRate: 92,
        status: "Online",
        monthlyQuota: 100000,
        phone: "+92 301 5544332",
        department: "Sales Management",
        category: "manager"
      });

      // Ensure User login exists
      const existingUser = await User.findOne({ email: "manager@onesoft.com" });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash("Manager@1234", 10);
        await User.create({
          name: "Imran Siddiqui",
          email: "manager@onesoft.com",
          password: hashedPassword,
          role: "manager",
          isVerified: true,
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
        });
      }
    }

    const activityCount = await Activity.countDocuments();
    if (activityCount === 0) {
      console.log("🌱 Seeding initial Activity timeline...");
      await Activity.insertMany([
        {
          title: "Agent Bilal closed Deal #301",
          description: "Signed 12-month contract with Vertex Enterprise ($14,800)",
          type: "deal",
          user: "Bilal Ahmed",
          timeAgo: "12 mins ago"
        },
        {
          title: "New inbound lead assigned to Sara",
          description: "CloudNet Inc requested a personalized demo on CRM pipeline",
          type: "lead",
          user: "Sara Khan",
          timeAgo: "34 mins ago"
        },
        {
          title: "System backup & Redis sync completed",
          description: "All 1,420 customer data points synchronized successfully",
          type: "system",
          user: "System",
          timeAgo: "1 hour ago"
        },
        {
          title: "Client Payment Processed",
          description: "Invoice #INV-2026-88 paid by Vertex Media ($5,200)",
          type: "payment",
          user: "Finance",
          timeAgo: "2 hours ago"
        }
      ]);
    }

    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      console.log("🌱 Seeding initial Notifications...");
      await Notification.insertMany([
        {
          title: "Revenue Milestone Achieved",
          description: "Q3 revenue crossed $128,450 with 12.5% increase.",
          type: "deal",
          isRead: false
        },
        {
          title: "New Enterprise Lead",
          description: "Nexus Technologies requested sales meeting for 50+ seats.",
          type: "lead",
          isRead: false
        },
        {
          title: "Weekly Backup Ready",
          description: "Database and audit logs archived securely on local cluster.",
          type: "system",
          isRead: false
        }
      ]);
    }

    const leadCount = await Lead.countDocuments();
    if (leadCount === 0) {
      console.log("🌱 Seeding sample Leads...");
      await Lead.insertMany([
        {
          name: "Alex Robinson",
          email: "alex@vertexglobal.com",
          company: "Vertex Global",
          phone: "+1 415 555 2671",
          source: "Organic Website",
          status: "Qualified",
          estimatedValue: 14800,
          notes: "Interested in full enterprise tier"
        },
        {
          name: "Sophia Martinez",
          email: "sophia@cloudnet.io",
          company: "CloudNet Systems",
          phone: "+1 650 555 8923",
          source: "Facebook & Social Ads",
          status: "Proposal Sent",
          estimatedValue: 24500,
          notes: "Requested migration consultation"
        },
        {
          name: "Daniel Craig",
          email: "d.craig@hyperion.co",
          company: "Hyperion Logistics",
          phone: "+44 20 7946 0912",
          source: "Client Referrals",
          status: "Contacted",
          estimatedValue: 9200,
          notes: "Referred by Alpha Corp"
        },
        {
          name: "Emma Watson",
          email: "emma@novatech.org",
          company: "Nova Technologies",
          phone: "+1 212 555 4481",
          source: "Cold Outreach & Email",
          status: "New",
          estimatedValue: 18000,
          notes: "Cold outreach response"
        }
      ]);
    }

    const dealCount = await Deal.countDocuments();
    if (dealCount === 0) {
      console.log("🌱 Seeding sample Deals...");
      await Deal.insertMany([
        {
          title: "Vertex Global - Enterprise CRM 12M",
          amount: 14800,
          stage: "Closed Won",
          probability: 100,
          month: "Oct"
        },
        {
          title: "CloudNet Systems - Platform Migration",
          amount: 24500,
          stage: "Negotiation",
          probability: 80,
          month: "Oct"
        },
        {
          title: "Hyperion Logistics - Workflow Automation",
          amount: 9200,
          stage: "Proposal Sent",
          probability: 60,
          month: "Oct"
        },
        {
          title: "Nova Technologies - Multi-Agent Suite",
          amount: 18000,
          stage: "Qualified",
          probability: 40,
          month: "Oct"
        }
      ]);
    }
    console.log("✅ Database verification & seeding check complete.");
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
  }
};
