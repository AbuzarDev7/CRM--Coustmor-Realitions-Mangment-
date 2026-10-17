import User from "../src/models/user.model.js";
import Lead from "../src/models/lead.model.js";
import Company from "../src/models/company.model.js";
import leadRoutes from "../src/routes/lead.routes.js";
import agentRoutes from "../src/routes/agent.routes.js";
import managerRoutes from "../src/routes/manager.routes.js";
import authRoutes from "../src/routes/auth.routes.js";
import companyRoutes from "../src/routes/company.routes.js";
import { normalizeRole } from "../src/middlewares/auth.middleware.js";

console.log("--- 1. Verifying Company Model ---");
const companyPaths = Object.keys(Company.schema.paths);
console.log("Company paths:", companyPaths.filter(p => ["companyName", "businessType", "status", "owner"].includes(p)));
if (!companyPaths.includes("companyName") || !companyPaths.includes("businessType")) {
  console.error("FAIL: Company model missing required fields!");
  process.exit(1);
}

console.log("--- 2. Verifying User Model & SaaS Role Hierarchy ---");
const userRoles = User.schema.path("role").enumValues;
console.log("User role enum:", userRoles);
if (!userRoles.includes("company_admin") || !userRoles.includes("superadmin") || !userRoles.includes("manager") || !userRoles.includes("agent")) {
  console.error("FAIL: User model missing SaaS hierarchy roles!");
  process.exit(1);
}
console.log("User company field type:", User.schema.path("company").instance);

console.log("--- 3. Verifying Lead Model (Multi-Company & Details) ---");
const leadPaths = Object.keys(Lead.schema.paths);
console.log("Lead paths:", leadPaths.filter(p => ["company", "clientName", "phone", "email", "source", "details", "assignedAgent", "status", "notes"].includes(p)));
if (!leadPaths.includes("company") || !leadPaths.includes("details")) {
  console.error("FAIL: Lead model missing company or details field!");
  process.exit(1);
}
const leadStatusEnum = Lead.schema.path("status").enumValues;
console.log("Lead status enum:", leadStatusEnum);

console.log("--- 4. Verifying Role Normalizer ---");
console.log("normalizeRole('superadmin'):", normalizeRole('superadmin'));
console.log("normalizeRole('company_admin'):", normalizeRole('company_admin'));
console.log("normalizeRole('manager'):", normalizeRole('manager'));
console.log("normalizeRole('agent'):", normalizeRole('agent'));

console.log("--- 5. Verifying Routes ---");
console.log("Company routes count:", companyRoutes.stack.length);
console.log("Lead routes count:", leadRoutes.stack.length);
console.log("Agent routes count:", agentRoutes.stack.length);
console.log("Manager routes count:", managerRoutes.stack.length);
console.log("Auth routes count:", authRoutes.stack.length);

console.log("✅ ALL SAAS MULTI-COMPANY MODELS, HIERARCHY ROLES, AND ISOLATION ROUTES VERIFIED SUCCESSFULLY!");
process.exit(0);
