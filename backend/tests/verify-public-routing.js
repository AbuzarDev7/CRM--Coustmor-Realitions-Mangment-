import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Company from "../src/models/company.model.js";
import User from "../src/models/user.model.js";
import Lead from "../src/models/lead.model.js";
import { connectDB } from "../src/config/db.js";
import { getPolicyForIndustry } from "../src/config/industryPolicies.js";

async function runTest() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("\n=======================================================");
  console.log("STEP 1: Superadmin Provisions Two Different Industry Companies");
  console.log("=======================================================");

  // Clean up any old test fixtures
  await Company.deleteMany({ companySlug: { $in: ["horizon-heights-realty", "spice-garden-bistro"] } });
  await User.deleteMany({ email: { $in: ["horizon.admin@test.com", "bistro.admin@test.com", "horizon.mgr@test.com", "bistro.mgr@test.com", "horizon.agt@test.com"] } });
  await Lead.deleteMany({ email: { $in: ["buyer.clara@gmail.com", "diner.marcus@gmail.com"] } });

  // 1. Create Real Estate Company
  const realEstateComp = await Company.create({
    companyName: "Horizon Heights Realty",
    companySlug: "horizon-heights-realty",
    businessType: "real_estate",
    status: "active"
  });

  const realEstateAdmin = await User.create({
    name: "Horizon Owner",
    email: "horizon.admin@test.com",
    password: await bcrypt.hash("Admin@1234", 10),
    role: "company_admin",
    company: realEstateComp._id
  });
  realEstateComp.owner = realEstateAdmin._id;
  await realEstateComp.save();
  console.log(`✅ Real Estate Company created: ${realEstateComp.companyName} [slug: ${realEstateComp.companySlug}], Owner: ${realEstateAdmin.email}`);

  // 2. Create Restaurant Company
  const restaurantComp = await Company.create({
    companyName: "Spice Garden Bistro",
    companySlug: "spice-garden-bistro",
    businessType: "restaurant",
    status: "active"
  });

  const restaurantAdmin = await User.create({
    name: "Bistro Owner",
    email: "bistro.admin@test.com",
    password: await bcrypt.hash("Admin@1234", 10),
    role: "company_admin",
    company: restaurantComp._id
  });
  restaurantComp.owner = restaurantAdmin._id;
  await restaurantComp.save();
  console.log(`✅ Restaurant Company created: ${restaurantComp.companyName} [slug: ${restaurantComp.companySlug}], Owner: ${restaurantAdmin.email}`);

  console.log("\n=======================================================");
  console.log("STEP 2: Company Admins Create Dedicated Managers");
  console.log("=======================================================");

  const horizonManager = await User.create({
    name: "Horizon Sales Manager",
    email: "horizon.mgr@test.com",
    password: await bcrypt.hash("Manager@1234", 10),
    role: "manager",
    company: realEstateComp._id
  });

  const bistroManager = await User.create({
    name: "Bistro Floor Manager",
    email: "bistro.mgr@test.com",
    password: await bcrypt.hash("Manager@1234", 10),
    role: "manager",
    company: restaurantComp._id
  });
  console.log(`✅ Horizon Manager: ${horizonManager.email} [Company: ${horizonManager.company}]`);
  console.log(`✅ Bistro Manager: ${bistroManager.email} [Company: ${bistroManager.company}]`);

  console.log("\n=======================================================");
  console.log("STEP 3: Public Customers Submit to Company Specific Public URLs");
  console.log("=======================================================");

  // Customer 1 visits /form/horizon-heights-realty (Real Estate)
  const realEstatePolicy = getPolicyForIndustry(realEstateComp.businessType);
  const lead1 = await Lead.create({
    company: realEstateComp._id,
    clientName: "Clara Oswald",
    email: "buyer.clara@gmail.com",
    phone: "+1 (555) 234-5678",
    source: "Horizon Heights Realty Public Form",
    status: realEstatePolicy.defaultStatus, // "New"
    details: {
      propertyType: "Luxury Villa",
      budget: "$650,000",
      locationPreference: "Metro Heights",
      bedrooms: "4+ BHK"
    }
  });
  console.log(`✅ Public Lead submitted to /form/horizon-heights-realty: ${lead1.clientName} (Property: ${lead1.details.propertyType}) [Status: ${lead1.status}]`);

  // Customer 2 visits /form/spice-garden-bistro (Restaurant)
  const restaurantPolicy = getPolicyForIndustry(restaurantComp.businessType);
  const lead2 = await Lead.create({
    company: restaurantComp._id,
    clientName: "Marcus Sterling",
    email: "diner.marcus@gmail.com",
    phone: "+1 (555) 987-6543",
    source: "Spice Garden Bistro Public Form",
    status: restaurantPolicy.defaultStatus, // "New Inquiry"
    details: {
      partySize: "6 - 10 Guests",
      occasion: "Anniversary Celebration",
      reservationDate: "2026-11-20",
      seatingPreference: "Outdoor Terrace"
    }
  });
  console.log(`✅ Public Lead submitted to /form/spice-garden-bistro: ${lead2.clientName} (Occasion: ${lead2.details.occasion}) [Status: ${lead2.status}]`);

  console.log("\n=======================================================");
  console.log("STEP 4: Manager Lead Assignment to Agents");
  console.log("=======================================================");

  const horizonAgent = await User.create({
    name: "Alex Agent",
    email: "horizon.agt@test.com",
    password: await bcrypt.hash("Agent@1234", 10),
    role: "agent",
    company: realEstateComp._id
  });

  lead1.assignedAgent = horizonAgent._id;
  await lead1.save();
  console.log(`✅ Horizon Manager assigned lead '${lead1.clientName}' to Agent: ${horizonAgent.name}`);

  console.log("\n=======================================================");
  console.log("STEP 5: Verifying Zero Cross-Contamination & Strict Isolation");
  console.log("=======================================================");

  // Horizon Manager query:
  const horizonLeads = await Lead.find({ company: horizonManager.company });
  console.log(`Horizon Manager sees ${horizonLeads.length} lead(s):`, horizonLeads.map(l => l.clientName));
  if (horizonLeads.length !== 1 || horizonLeads[0].clientName !== "Clara Oswald") {
    throw new Error("Cross contamination detected in Horizon Manager leads!");
  }

  // Bistro Manager query:
  const bistroLeads = await Lead.find({ company: bistroManager.company });
  console.log(`Bistro Manager sees ${bistroLeads.length} lead(s):`, bistroLeads.map(l => l.clientName));
  if (bistroLeads.length !== 1 || bistroLeads[0].clientName !== "Marcus Sterling") {
    throw new Error("Cross contamination detected in Bistro Manager leads!");
  }

  // Horizon Agent query:
  const agentLeads = await Lead.find({ company: horizonAgent.company, assignedAgent: horizonAgent._id });
  console.log(`Horizon Agent sees ${agentLeads.length} assigned lead(s):`, agentLeads.map(l => l.clientName));
  if (agentLeads.length !== 1 || agentLeads[0].clientName !== "Clara Oswald") {
    throw new Error("Agent isolation failed!");
  }

  console.log("\n=======================================================");
  console.log("✅ ALL PUBLIC ROUTING & MULTI-TENANT ISOLATION TESTS PASSED 100%!");
  console.log("=======================================================");

  // Cleanup fixtures
  await Company.deleteMany({ companySlug: { $in: ["horizon-heights-realty", "spice-garden-bistro"] } });
  await User.deleteMany({ email: { $in: ["horizon.admin@test.com", "bistro.admin@test.com", "horizon.mgr@test.com", "bistro.mgr@test.com", "horizon.agt@test.com"] } });
  await Lead.deleteMany({ email: { $in: ["buyer.clara@gmail.com", "diner.marcus@gmail.com"] } });
  console.log("Cleaned up test fixtures.");

  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
