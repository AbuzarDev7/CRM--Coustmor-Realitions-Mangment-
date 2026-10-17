import { Router } from "express";
import {
  register,
  verifyOtp,
  login,
  refreshToken,
  logout
} from "../controllers/auth.controller.js";
import {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback
} from "../controllers/oauth.controller.js";
import { verifyToken, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// OAuth routes for Google and GitHub
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);
router.post("/github/callback", githubCallback);

import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";

// Protected route to verify user session with fresh DB records & avatar
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const email = (req.user?.email || "").toLowerCase().trim();

    let dbUser = null;
    if (userId) {
      dbUser = await User.findById(userId).select("-password");
    }
    if (!dbUser && email) {
      dbUser = await User.findOne({ email }).select("-password");
    }

    const staffProfile = email ? await Staff.findOne({ email }) : null;
    const avatar = dbUser?.avatar || staffProfile?.avatar || req.user?.avatar || "";
    const name = dbUser?.name || staffProfile?.name || req.user?.name || (email ? email.split("@")[0] : "User");
    const role = dbUser?.role || staffProfile?.role || req.user?.role || "customer";

    const userObj = {
      id: dbUser?._id || userId,
      _id: dbUser?._id || userId,
      userId: dbUser?._id || userId,
      name,
      email: dbUser?.email || email,
      role,
      avatar,
      department: staffProfile?.department || ""
    };

    return res.json({ message: "Authenticated user details", user: userObj });
  } catch (error) {
    console.error("GET /me error:", error);
    return res.status(500).json({ error: "Failed to fetch user session", user: req.user });
  }
});

// GET /api/users?role=agent (Real dynamic agents/users from DB)
router.get("/users", async (req, res) => {
  try {
    const roleParam = (req.query.role || "").toLowerCase().trim();
    let query = {};
    if (roleParam) {
      query = { role: roleParam };
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    if (roleParam === "agent" || roleParam === "staff" || !roleParam) {
      const staffQuery = roleParam ? { category: roleParam } : { category: { $ne: "manager" } };
      const staffMembers = await Staff.find(staffQuery).sort({ createdAt: -1 });

      const emailMap = new Map();
      users.forEach((u) => emailMap.set(u.email.toLowerCase(), u.toObject ? u.toObject() : u));
      staffMembers.forEach((s) => {
        const email = s.email.toLowerCase();
        if (!emailMap.has(email)) {
          emailMap.set(email, {
            _id: s._id,
            id: s._id,
            name: s.name,
            email: s.email,
            role: s.role || (s.category === "staff" ? "staff" : "agent"),
            avatar: s.avatar,
            category: s.category || "agent",
            phone: s.phone,
            totalValue: s.totalValue || 0,
            dealsClosed: s.dealsClosed || 0,
            activeLeadsCount: s.activeLeadsCount || 0
          });
        }
      });

      const merged = Array.from(emailMap.values());
      return res.status(200).json({ success: true, count: merged.length, users: merged, agents: merged });
    }

    return res.status(200).json({ success: true, count: users.length, users, agents: users });
  } catch (error) {
    console.error("Get Users Error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// User Profile & Avatar Update Route (Super Admin, Manager, Agent, Customer)
router.put("/profile", optionalAuth, async (req, res) => {
  try {
    const { name, avatar, phone, email } = req.body;
    const targetEmail = (email || req.user?.email || "").toLowerCase().trim();
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (avatar !== undefined) updateFields.avatar = avatar;

    let updatedUser = null;
    if (userId) {
      updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select("-password");
    }
    if (targetEmail) {
      const emailUser = await User.findOneAndUpdate({ email: targetEmail }, updateFields, { new: true }).select("-password");
      if (!updatedUser) updatedUser = emailUser;
    }

    if (!updatedUser && targetEmail) {
      const staffMember = await Staff.findOne({ email: targetEmail });
      if (staffMember) {
        updatedUser = await User.create({
          name: name || staffMember.name,
          email: targetEmail,
          role: staffMember.category === "manager" ? "manager" : (staffMember.category === "staff" ? "staff" : "agent"),
          avatar: avatar !== undefined ? avatar : staffMember.avatar,
          isVerified: true
        });
      }
    }

    const emailToMatch = (targetEmail || updatedUser?.email || "").toLowerCase().trim();
    if (emailToMatch) {
      const staffUpdate = {};
      if (name) staffUpdate.name = name.trim();
      if (avatar !== undefined) staffUpdate.avatar = avatar;
      if (phone) staffUpdate.phone = phone.trim();
      await Staff.findOneAndUpdate({ email: emailToMatch }, staffUpdate);
    }

    const finalAvatar = updatedUser?.avatar || avatar || "";
    const finalName = updatedUser?.name || name || "";
    const finalEmail = updatedUser?.email || emailToMatch;

    return res.status(200).json({
      success: true,
      message: "Profile and avatar updated successfully!",
      user: updatedUser
        ? { ...updatedUser.toObject(), avatar: finalAvatar }
        : { id: userId, email: finalEmail, name: finalName, avatar: finalAvatar }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

router.patch("/profile", optionalAuth, async (req, res) => {
  try {
    const { name, avatar, phone, email } = req.body;
    const targetEmail = (email || req.user?.email || "").toLowerCase().trim();
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (avatar !== undefined) updateFields.avatar = avatar;

    let updatedUser = null;
    if (userId) {
      updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select("-password");
    }
    if (targetEmail) {
      const emailUser = await User.findOneAndUpdate({ email: targetEmail }, updateFields, { new: true }).select("-password");
      if (!updatedUser) updatedUser = emailUser;
    }

    if (!updatedUser && targetEmail) {
      const staffMember = await Staff.findOne({ email: targetEmail });
      if (staffMember) {
        updatedUser = await User.create({
          name: name || staffMember.name,
          email: targetEmail,
          role: staffMember.category === "manager" ? "manager" : (staffMember.category === "staff" ? "staff" : "agent"),
          avatar: avatar !== undefined ? avatar : staffMember.avatar,
          isVerified: true
        });
      }
    }

    const emailToMatch = (targetEmail || updatedUser?.email || "").toLowerCase().trim();
    if (emailToMatch) {
      const staffUpdate = {};
      if (name) staffUpdate.name = name.trim();
      if (avatar !== undefined) staffUpdate.avatar = avatar;
      if (phone) staffUpdate.phone = phone.trim();
      await Staff.findOneAndUpdate({ email: emailToMatch }, staffUpdate);
    }

    const finalAvatar = updatedUser?.avatar || avatar || "";
    const finalName = updatedUser?.name || name || "";
    const finalEmail = updatedUser?.email || emailToMatch;

    return res.status(200).json({
      success: true,
      message: "Profile and avatar updated successfully!",
      user: updatedUser
        ? { ...updatedUser.toObject(), avatar: finalAvatar }
        : { id: userId, email: finalEmail, name: finalName, avatar: finalAvatar }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;

