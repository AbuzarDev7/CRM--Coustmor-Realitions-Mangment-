import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = bearerToken || req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  // If user is authenticated and is an admin
  if (req.user && (req.user.role === "admin" || req.user.role === "engineer")) {
    return next();
  }
  return res.status(403).json({
    error: "Forbidden. Administrative privileges required to perform this action."
  });
};

export const requireManager = (req, res, next) => {
  // If user is authenticated and is a manager or super admin
  if (
    req.user &&
    (req.user.role === "manager" || req.user.role === "admin" || req.user.role === "engineer")
  ) {
    return next();
  }
  return res.status(403).json({
    error: "Forbidden. Manager or Administrative privileges required."
  });
};

export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = bearerToken || req.cookies?.refreshToken;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (err) {
    // Ignore error for optional authentication
  }
  next();
};

export default verifyToken;
