import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Company from "../models/company.model.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import Lead from "../models/lead.model.js";
import { slugify } from "../config/industryPolicies.js";

/**
 * 1. Superadmin: Create an independent Company and its Company Admin (Owner)
 * POST /api/companies
 */
export const createCompany = async (req, res) => {
  try {
    const {
      companyName,
      businessType,
      adminName,
      adminEmail,
      adminPassword,
      contactPhone,
      address
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (!adminEmail || !adminEmail.trim()) {
      return res.status(400).json({ error: "Company Admin email is required" });
    }

    const cleanEmail = adminEmail.toLowerCase().trim();
    const cleanCompanyName = companyName.trim();

    // Check if company already exists
    const existingCompany = await Company.findOne({
      companyName: { $regex: new RegExp(`^${cleanCompanyName}$`, "i") }
    });
    if (existingCompany) {
      return res.status(400).json({ error: "A company with this name already exists" });
    }

    // Check if user with admin email exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this admin email already exists" });
    }

    // 1. Create Company
    const newCompany = await Company.create({
      companyName: cleanCompanyName,
      businessType: businessType || "real_estate",
      status: "active",
      contactEmail: cleanEmail,
      contactPhone: contactPhone || "",
      address: address || ""
    });

    // 2. Create Company Admin (Owner)
    const rawPassword = adminPassword || "CompanyAdmin@1234";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const companyAdmin = await User.create({
      name: (adminName && adminName.trim()) || `${cleanCompanyName} Admin`,
      email: cleanEmail,
      password: hashedPassword,
      role: "company_admin",
      company: newCompany._id,
      isVerified: true
    });

    // Attach owner to Company
    newCompany.owner = companyAdmin._id;
    await newCompany.save();

    // Create corresponding Staff record
    await Staff.create({
      name: companyAdmin.name,
      email: cleanEmail,
      role: "Company Admin",
      category: "manager",
      company: newCompany._id,
      phone: contactPhone || "",
      department: "Executive Management",
      status: "Online"
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Company '${newCompany.companyName}' and Company Admin account created successfully!`,
      company: newCompany,
      adminCredentials: {
        email: cleanEmail,
        role: "company_admin",
        initialPassword: rawPassword
      }
    });
  } catch (error) {
    console.error("Create Company Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create company" });
  }
};

/**
 * 2. Superadmin: List all companies with aggregated metrics
 * GET /api/companies
 */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      companies.map(async (c) => {
        const managersCount = await User.countDocuments({ company: c._id, role: "manager" });
        const agentsCount = await User.countDocuments({ company: c._id, role: "agent" });
        const leadsCount = await Lead.countDocuments({ company: c._id });

        return {
          ...c.toObject(),
          managersCount,
          agentsCount,
          leadsCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enriched.length,
      companies: enriched
    });
  } catch (error) {
    console.error("Get Companies Error:", error);
    return res.status(500).json({ error: "Failed to load companies" });
  }
};

/**
 * 3. Superadmin / Company Admin: Get specific company details
 * GET /api/companies/:id
 */
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Enforce tenant isolation for non-superadmin
    if (req.user?.role !== "superadmin" && String(req.user?.companyId) !== String(id)) {
      return res.status(403).json({ error: "Access denied. You cannot view another company's profile." });
    }

    const company = await Company.findById(id).populate("owner", "name email role");
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const managers = await User.find({ company: company._id, role: "manager" }).select("name email role createdAt");
    const agents = await User.find({ company: company._id, role: "agent" }).select("name email role createdAt");
    const totalLeads = await Lead.countDocuments({ company: company._id });

    return res.status(200).json({
      success: true,
      company,
      metrics: {
        managersCount: managers.length,
        agentsCount: agents.length,
        totalLeads
      },
      managers,
      agents
    });
  } catch (error) {
    console.error("Get Company Detail Error:", error);
    return res.status(500).json({ error: "Failed to get company details" });
  }
};

/**
 * 4. Company Admin: Create a Manager for their Company
 * POST /api/companies/managers
 */
export const createCompanyManager = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    // Resolve target company ID
    let targetCompanyId = req.user?.companyId;
    if (req.user?.role === "superadmin" && req.body.companyId) {
      targetCompanyId = req.body.companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ error: "Company ID is required to create a Manager" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Manager full name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Manager email address is required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: `An account with email '${cleanEmail}' already exists` });
    }

    const rawPassword = password?.trim() || "Manager@1234";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const managerUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "manager",
      company: targetCompanyId,
      isVerified: true
    });

    await Staff.create({
      name: name.trim(),
      email: cleanEmail,
      role: "Branch Sales Manager",
      category: "manager",
      company: targetCompanyId,
      phone: phone?.trim() || "",
      department: department?.trim() || "Sales Management",
      status: "Online"
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Manager '${managerUser.name}' created successfully for your company!`,
      manager: {
        id: managerUser._id,
        name: managerUser.name,
        email: managerUser.email,
        role: managerUser.role,
        company: targetCompanyId
      }
    });
  } catch (error) {
    console.error("Create Company Manager Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create manager" });
  }
};

/**
 * 5. Company Admin / Superadmin: List managers for company
 * GET /api/companies/:id/managers
 */
export const getCompanyManagers = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "superadmin" && String(req.user?.companyId) !== String(id)) {
      return res.status(403).json({ error: "Access denied." });
    }

    const managers = await User.find({ company: id, role: "manager" })
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: managers.length, managers });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load managers" });
  }
};

/**
 * 6. Superadmin: Update Company Status (active / suspended)
 * PATCH /api/companies/:id/status
 */
export const updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "suspended", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await Company.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Company not found" });

    return res.status(200).json({ success: true, message: `Company status updated to '${status}'`, company: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status" });
  }
};

/**
 * 7. Superadmin / Company Admin: Edit, update company profile and settings
 * PUT /api/companies/:id
 */
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Non-superadmin can only update their own company
    if (req.user?.role !== "superadmin" && String(req.user?.companyId) !== String(id)) {
      return res.status(403).json({ error: "Access denied. Cannot update another company." });
    }

    const {
      companyName,
      businessType,
      industryType,
      contactPhone,
      contactEmail,
      address,
      status,
      settings
    } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (companyName && companyName.trim() && companyName.trim() !== company.companyName) {
      const existing = await Company.findOne({
        companyName: { $regex: new RegExp(`^${companyName.trim()}$`, "i") },
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({ error: "Another company with this name already exists" });
      }
      company.companyName = companyName.trim();
      company.companySlug = slugify(companyName.trim());
    }

    if (businessType || industryType) {
      company.businessType = businessType || industryType;
    }
    if (contactPhone !== undefined) company.contactPhone = contactPhone;
    if (contactEmail !== undefined) company.contactEmail = contactEmail;
    if (address !== undefined) company.address = address;
    if (status && req.user?.role === "superadmin") company.status = status;
    if (settings) company.settings = { ...company.settings, ...settings };

    await company.save();

    return res.status(200).json({
      success: true,
      message: `Company '${company.companyName}' updated successfully!`,
      company
    });
  } catch (error) {
    console.error("Update Company Error:", error);
    return res.status(500).json({ error: error.message || "Failed to update company" });
  }
};
