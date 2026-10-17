import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import { normalizeRole } from "../middlewares/auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

/**
 * 1. Public Registration is completely disabled
 * Customers do NOT have accounts.
 * Managers are provisioned by Superadmins.
 * Agents are provisioned by Managers.
 */
export const register = async (req, res) => {
  return res.status(403).json({
    success: false,
    error: "Public customer registration is disabled. Superadmins create Manager accounts, and Managers create Agent accounts directly from their dashboards."
  });
};

/**
 * 2. Verify OTP (Retained as safe stub)
 */
export const verifyOtp = async (req, res) => {
  return res.status(400).json({
    success: false,
    error: "Account registration is managed via administrative invites."
  });
};

/**
 * 3. Staff User Login (Superadmin, Manager, Agent)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({
        error: "This account does not have a direct password set. Please contact your manager or superadmin."
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const canonicalRole = normalizeRole(user.role);

    // Resolve full name and avatar from Staff profile or User model
    const staffProfile = await Staff.findOne({ email: user.email.toLowerCase() });
    const displayName = user.name || staffProfile?.name || user.email.split("@")[0];
    const userAvatar = user.avatar || staffProfile?.avatar || "";

    // Sync avatar between User and Staff
    if (user.avatar && staffProfile && !staffProfile.avatar) {
      staffProfile.avatar = user.avatar;
      await staffProfile.save().catch(() => {});
    } else if (!user.avatar && staffProfile?.avatar) {
      user.avatar = staffProfile.avatar;
      await user.save().catch(() => {});
    }

    // Resolve Company if applicable
    const companyId = user.company ? String(user.company) : (staffProfile?.company ? String(staffProfile.company) : null);

    // JWT Token for internal staff
    const token = jwt.sign(
      {
        userId: user._id,
        name: displayName,
        email: user.email,
        role: canonicalRole,
        userRole: canonicalRole,
        companyId,
        company: companyId,
        avatar: userAvatar
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Login successful!",
      accessToken: token,
      token,
      user: {
        id: user._id,
        _id: user._id,
        userId: user._id,
        name: displayName,
        email: user.email,
        role: canonicalRole,
        userRole: canonicalRole,
        company: user.company || companyId,
        companyId,
        avatar: userAvatar
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 4. Refresh Token route
 */
export const refreshToken = (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (!tokenFromCookie) {
      return res.status(401).json({ error: "No active session" });
    }

    const decoded = jwt.verify(tokenFromCookie, JWT_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: normalizeRole(decoded.role) },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

/**
 * 5. Logout route
 */
export const logout = (req, res) => {
  try {
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Failed to logout" });
  }
};
