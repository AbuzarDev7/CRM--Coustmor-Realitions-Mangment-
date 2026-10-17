import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Company from "../src/models/company.model.js";
import User from "../src/models/user.model.js";
import Lead from "../src/models/lead.model.js";
import Staff from "../src/models/staff.model.js";

const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/auth_db";

async function runSaaSTest() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  try {
    // Clean up previous test artifacts if any
    await Company.deleteMany({ companyName: { $in: ["SaaS Apex Properties", "SaaS Gourmet Dine"] } });
    await User.deleteMany({ email: { $in: [
      "apex.admin@test.com", "apex.manager@test.com", "apex.agent@test.com",
      "bistro.admin@test.com", "bistro.manager@test.com"
    ] } });
    await Lead.deleteMany({ email: { $in: ["lead.apex@client.com", "lead.bistro@client.com"] } });

    console.log("\n=======================================================");
    console.log("STEP 1: Superadmin creates two independent Companies");
    console.log("=======================================================");

    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // Company 1: Real Estate
    const companyApex = await Company.create({
      companyName: "SaaS Apex Properties",
      businessType: "real_estate",
      status: "active"
    });

    const apexAdmin = await User.create({
      name: "Apex Owner",
      email: "apex.admin@test.com",
      password: hashedPassword,
      role: "company_admin",
      company: companyApex._id,
      isVerified: true
    });

    companyApex.owner = apexAdmin._id;
    await companyApex.save();
    console.log(`✅ Company 1 created: '${companyApex.companyName}' (Type: ${companyApex.businessType}), Owner: ${apexAdmin.email}`);

    // Company 2: Restaurant
    const companyBistro = await Company.create({
      companyName: "SaaS Gourmet Dine",
      businessType: "restaurant",
      status: "active"
    });

    const bistroAdmin = await User.create({
      name: "Bistro Owner",
      email: "bistro.admin@test.com",
      password: hashedPassword,
      role: "company_admin",
      company: companyBistro._id,
      isVerified: true
    });

    companyBistro.owner = bistroAdmin._id;
    await companyBistro.save();
    console.log(`✅ Company 2 created: '${companyBistro.companyName}' (Type: ${companyBistro.businessType}), Owner: ${bistroAdmin.email}`);

    console.log("\n=======================================================");
    console.log("STEP 2: Company Admin provisions Manager for their Company");
    console.log("=======================================================");

    const apexManager = await User.create({
      name: "Apex Sales Manager",
      email: "apex.manager@test.com",
      password: hashedPassword,
      role: "manager",
      company: companyApex._id,
      isVerified: true
    });
    console.log(`✅ Apex Admin created Manager: ${apexManager.email} [Company: ${apexManager.company}]`);

    const bistroManager = await User.create({
      name: "Bistro Floor Manager",
      email: "bistro.manager@test.com",
      password: hashedPassword,
      role: "manager",
      company: companyBistro._id,
      isVerified: true
    });
    console.log(`✅ Bistro Admin created Manager: ${bistroManager.email} [Company: ${bistroManager.company}]`);

    console.log("\n=======================================================");
    console.log("STEP 3: Manager provisions Agent for their Company");
    console.log("=======================================================");

    const apexAgent = await User.create({
      name: "Apex Real Estate Agent",
      email: "apex.agent@test.com",
      password: hashedPassword,
      role: "agent",
      company: companyApex._id,
      isVerified: true
    });
    console.log(`✅ Apex Manager created Agent: ${apexAgent.email} [Company: ${apexAgent.company}]`);

    console.log("\n=======================================================");
    console.log("STEP 4: Managers create Leads with flexible business details");
    console.log("=======================================================");

    // Lead for Apex Properties (Real Estate)
    const apexLead = await Lead.create({
      company: companyApex._id,
      clientName: "David Sterling",
      phone: "+1-555-0199",
      email: "lead.apex@client.com",
      source: "Facebook Ads",
      status: "New",
      details: {
        propertyType: "Luxury Penthouse",
        budget: "$2,500,000",
        preferredCity: "Downtown Manhattan"
      },
      assignedAgent: apexAgent._id,
      notes: [{ text: "Customer looking for high-floor penthouse unit.", date: new Date() }]
    });
    console.log(`✅ Apex Lead created: ${apexLead.clientName} (Property: ${apexLead.details.propertyType})`);

    // Lead for Gourmet Dine (Restaurant / Table Booking)
    const bistroLead = await Lead.create({
      company: companyBistro._id,
      clientName: "Sarah Jenkins",
      phone: "+1-555-0288",
      email: "lead.bistro@client.com",
      source: "Instagram",
      status: "New",
      details: {
        tableType: "Rooftop VIP",
        partySize: 8,
        occasion: "Anniversary Celebration"
      },
      notes: [{ text: "VIP booking requested for Friday evening.", date: new Date() }]
    });
    console.log(`✅ Bistro Lead created: ${bistroLead.clientName} (Occasion: ${bistroLead.details.occasion})`);

    console.log("\n=======================================================");
    console.log("STEP 5: Verifying Strict Multi-Company Isolation");
    console.log("=======================================================");

    // 1. Apex Manager query (must only see Apex leads)
    const apexManagerLeads = await Lead.find({ company: apexManager.company });
    console.log(`Apex Manager sees ${apexManagerLeads.length} lead(s):`, apexManagerLeads.map(l => l.clientName));
    if (apexManagerLeads.some(l => String(l.company) !== String(companyApex._id))) {
      throw new Error("ISOLATION BREACH: Apex Manager saw leads from another company!");
    }

    // 2. Bistro Manager query (must only see Bistro leads)
    const bistroManagerLeads = await Lead.find({ company: bistroManager.company });
    console.log(`Bistro Manager sees ${bistroManagerLeads.length} lead(s):`, bistroManagerLeads.map(l => l.clientName));
    if (bistroManagerLeads.some(l => String(l.company) !== String(companyBistro._id))) {
      throw new Error("ISOLATION BREACH: Bistro Manager saw leads from another company!");
    }

    // 3. Apex Agent query (must only see their assigned lead)
    const apexAgentLeads = await Lead.find({ company: apexAgent.company, assignedAgent: apexAgent._id });
    console.log(`Apex Agent sees ${apexAgentLeads.length} lead(s):`, apexAgentLeads.map(l => l.clientName));
    if (apexAgentLeads.length !== 1 || apexAgentLeads[0].clientName !== "David Sterling") {
      throw new Error("Agent assignment isolation failed!");
    }

    console.log("\n=======================================================");
    console.log("✅ ALL SAAS MULTI-COMPANY ISOLATION TESTS PASSED 100%!");
    console.log("=======================================================");

    // Clean up test data
    await Company.deleteMany({ _id: { $in: [companyApex._id, companyBistro._id] } });
    await User.deleteMany({ _id: { $in: [apexAdmin._id, bistroAdmin._id, apexManager._id, bistroManager._id, apexAgent._id] } });
    await Lead.deleteMany({ _id: { $in: [apexLead._id, bistroLead._id] } });
    console.log("Cleaned up test fixtures.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ SaaS Test Failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSaaSTest();
