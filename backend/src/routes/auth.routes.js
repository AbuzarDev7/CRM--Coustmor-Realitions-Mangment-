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
import { verifyToken } from "../middlewares/auth.middleware.js";

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

// Protected route example to verify user session
router.get("/me", verifyToken, (req, res) => {
  res.json({ message: "Authenticated user details", user: req.user });
});

export default router;

