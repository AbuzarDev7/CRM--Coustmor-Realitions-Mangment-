import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

/**
 * Normalizes role string to canonical hierarchy enum:
 * 'superadmin' | 'company_admin' | 'manager' | 'agent'
 */
export const normalizeRole = (role) => {
  if (!role) return "agent";
  const r = role.toString().toLowerCase().trim();
  if (r === "superadmin" || r === "admin" || r === "root" || r === "engineer") return "superadmin";
  if (r === "company_admin" || r === "companyadmin" || r === "owner") return "company_admin";
  if (r === "manager") return "manager";
  return "agent";
};

/**
 * Strict JWT Verification Middleware for Multi-Company CRM Staff
 * Attaches userId, userRole, and companyId to req.user for strict tenant isolation.
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken =
      authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token =
      bearerToken ||
      req.cookies?.token ||
      req.cookies?.refreshToken ||
      req.headers["x-access-token"];

    if (!token) {
      return res.status(401).json({
        error: "Access denied. No token provided."
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const resolvedRole = normalizeRole(decoded.role || decoded.userRole);
    const resolvedCompanyId =
      decoded.companyId ||
      decoded.company ||
      (decoded.user && (decoded.user.companyId || decoded.user.company)) ||
      null;

    req.user = {
      ...decoded,
      id: decoded.userId || decoded._id || decoded.id,
      userId: decoded.userId || decoded._id || decoded.id,
      role: decoded.role || resolvedRole,
      userRole: resolvedRole,
      companyId: resolvedCompanyId ? String(resolvedCompanyId) : null,
      company: resolvedCompanyId ? String(resolvedCompanyId) : null
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token."
    });
  }
};

/**
 * Role-Based Access Control Middleware Factory
 */
export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        error: "Forbidden. Administrative privileges required to perform this action."
      });
    }

    const userRole = normalizeRole(req.user.role || req.user.userRole);

    // Superadmin has universal global oversight privileges across all companies
    if (userRole === "superadmin") {
      return next();
    }

    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    if (normalizedAllowed.includes("manager")) {
      return res.status(403).json({
        error: "Forbidden. Manager or Administrative privileges required."
      });
    }

    if (normalizedAllowed.includes("superadmin") && normalizedAllowed.length === 1) {
      return res.status(403).json({
        error: "Forbidden. Administrative privileges required to perform this action."
      });
    }

    return res.status(403).json({
      error: `Forbidden. Action requires role [${allowedRoles.join(", ")}]. Current role is '${userRole}'.`
    });
  };
};

/**
 * Company Isolation Guard: Ensures non-superadmin users belong to a valid Company
 */
export const requireCompanyContext = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  // Superadmin has global multi-tenant oversight
  if (req.user.role === "superadmin") {
    return next();
  }

  if (!req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: "Access denied. User account is not assigned to an active Company."
    });
  }

  next();
};

// Convenience role middlewares following SaaS hierarchy
export const requireSuperAdmin = authorizeRoles("superadmin");
export const requireCompanyAdmin = authorizeRoles("superadmin", "company_admin");
export const requireManager = authorizeRoles("superadmin", "company_admin", "manager");
export const requireAgent = authorizeRoles("superadmin", "company_admin", "manager", "agent");

// Backward-compatibility aliases
export const requireAdmin = requireSuperAdmin;

/**
 * Optional Authentication: Attaches req.user with role & companyId if token is present
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken =
      authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token =
      bearerToken ||
      req.cookies?.token ||
      req.cookies?.refreshToken ||
      req.headers["x-access-token"];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const resolvedRole = normalizeRole(decoded.role || decoded.userRole);
      const resolvedCompanyId =
        decoded.companyId ||
        decoded.company ||
        (decoded.user && (decoded.user.companyId || decoded.user.company)) ||
        null;

      req.user = {
        ...decoded,
        id: decoded.userId || decoded._id || decoded.id,
        userId: decoded.userId || decoded._id || decoded.id,
        role: resolvedRole,
        userRole: resolvedRole,
        companyId: resolvedCompanyId ? String(resolvedCompanyId) : null,
        company: resolvedCompanyId ? String(resolvedCompanyId) : null
      };
    }
  } catch (err) {
    // Ignore error for optional authentication
  }
  next();
};

export default verifyToken;
