import crypto from "crypto";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { redis } from "../config/redis.js";
import { transporter } from "../config/nodemailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

// Helper: 6-digit OTP
const createOtp = () => crypto.randomInt(100000, 1000000).toString();

// 1. User Registration & Send OTP
export const register = async (req, res) => {
  try {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });

    const { email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // Check karo user pehle se exist toh nahi karta
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: "User already registered and verified. Please login." });
    }

    // Password ko encrypt (hash) karo
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser && !existingUser.isVerified) {
      // Agar pehle register kiya tha lekin verify nahi kiya, password update kardo
      existingUser.password = hashedPassword;
      await existingUser.save();
    } else {
      // Naya unverified user banao
      await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: false
      });
    }

    // OTP generate karo
    const otp = createOtp();

    // Redis mein OTP 5 minutes (300 seconds) ke liye save karo
    await redis.set(`otp:${normalizedEmail}`, otp, "EX", 300);

    // User ki di hui email par OTP bhejo
    await transporter.sendMail({
      from: `"Auth Support" <${process.env.GMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Verification OTP Code",
      text: `Your account verification OTP is: ${otp}. It will expire in 5 minutes.`
    });

    return res.status(201).json({
      message: "Registration initiated! OTP sent to your email. Please verify to activate account."
    });
  } catch (error) {
    if (error?.issues && error.issues[0]?.message) {
      return res.status(400).json({ error: `${error.issues[0].path?.join('.') || 'Input'}: ${error.issues[0].message}` });
    }
    return res.status(400).json({ error: error.message });
  }
};

// 2. Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Redis se OTP check karo
    const storedOtp = await redis.get(`otp:${normalizedEmail}`);

    if (!storedOtp) {
      return res.status(400).json({ error: "OTP expired or not found. Please register again." });
    }

    if (storedOtp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    // MongoDB mein user ko verified mark karo
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Redis se OTP delete kardo taake dubara use na ho
    await redis.del(`otp:${normalizedEmail}`);

    // JWT Token generate karo
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
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
      message: "Email verified successfully! You are now logged in.",
      accessToken: token,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 3. User Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // MongoDB mein user dhoondo
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check karo kya user ne OTP verify kiya tha?
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Account not verified. Please verify your email first."
      });
    }

    // Password match karo
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // JWT Token banao
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
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
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 4. Refresh Token route
export const refreshToken = (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (!tokenFromCookie) {
      return res.status(401).json({ error: "No active session" });
    }

    const decoded = jwt.verify(tokenFromCookie, JWT_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

// 5. Logout route
export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out successfully" });
};

