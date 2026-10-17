import "dotenv/config";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const getJwtSecret = () => process.env.JWT_SECRET || "mysecretkey123";
const getClientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const getBackendUrl = () => (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Helper to set cookie and redirect (or send JSON) with authentication token
const handleOAuthSuccess = (res, user, req) => {
  try {
    const displayName = user.name || (user.email ? user.email.split("@")[0] : "User");
    const token = jwt.sign(
      { userId: user._id, name: displayName, email: user.email, role: user.role, avatar: user.avatar || "" },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userData = {
      id: user._id,
      _id: user._id,
      userId: user._id,
      email: user.email,
      name: displayName,
      role: user.role || "customer",
      avatar: user.avatar || ""
    };

    // If client requested JSON via fetch / AJAX
    if (req && (req.headers.accept?.includes("application/json") || req.xhr || req.method === "POST")) {
      return res.status(200).json({
        success: true,
        token,
        accessToken: token,
        user: userData
      });
    }

    const queryParams = new URLSearchParams({
      token,
      email: user.email,
      name: displayName,
      role: user.role || "customer",
      avatar: user.avatar || ""
    });

    return res.redirect(`${getClientUrl()}/login?${queryParams.toString()}`);
  } catch (error) {
    console.error("handleOAuthSuccess error:", error);
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent("Authentication token creation failed.")}`);
  }
};

// 1. Google Auth - Step 1: Redirect to Google consent screen
export const googleAuth = (req, res) => {
  try {
    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
      return res.redirect(
        `${getClientUrl()}/login?error=${encodeURIComponent(
          "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env file."
        )}`
      );
    }

    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${getBackendUrl()}/api/auth/google/callback`;
    const scope = ["openid", "email", "profile"].join(" ");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
      scope
    )}&access_type=offline&prompt=select_account`;

    return res.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Google Auth error:", error);
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent("Failed to initialize Google login.")}`);
  }
};

// 2. Google Auth - Step 2: Callback from Google
export const googleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(
        `${getClientUrl()}/login?error=${encodeURIComponent(error || "Google authentication was cancelled.")}`
      );
    }

    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${getBackendUrl()}/api/auth/google/callback`;

    // Exchange code for access_token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: (process.env.GOOGLE_CLIENT_ID || "").trim(),
        client_secret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const { access_token } = tokenResponse.data;

    // Fetch user profile from Google
    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { id: googleId, email, name, picture } = profileResponse.data;

    if (!email) {
      return res.redirect(
        `${getClientUrl()}/login?error=${encodeURIComponent("Could not retrieve email from Google account.")}`
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.name && name) user.name = name;
      if (!user.avatar && picture) user.avatar = picture;
      user.isVerified = true;
      await user.save();
    } else {
      user = await User.create({
        email: normalizedEmail,
        name: name || "",
        avatar: picture || "",
        provider: "google",
        googleId,
        isVerified: true,
        role: "customer"
      });
    }

    return handleOAuthSuccess(res, user, req);
  } catch (err) {
    console.error("Google OAuth Callback Error:", err.response?.data || err.message);
    const errorMessage =
      err.response?.data?.error_description || err.message || "Failed to authenticate with Google.";
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(errorMessage)}`);
  }
};

// 3. GitHub Auth - Step 1: Redirect to GitHub consent screen
export const githubAuth = (req, res) => {
  try {
    const clientId = (process.env.GITHUB_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GITHUB_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
      return res.redirect(
        `${getClientUrl()}/login?error=${encodeURIComponent(
          "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend .env file."
        )}`
      );
    }

    // Only include redirect_uri if explicitly provided in environment variables.
    // If omitted, GitHub automatically uses the callback URL configured in the GitHub OAuth application settings,
    // avoiding the "The redirect_uri is not associated with this application" error.
    const customCallbackUrl = (process.env.GITHUB_CALLBACK_URL || "").trim();
    const redirectParam = customCallbackUrl ? `&redirect_uri=${encodeURIComponent(customCallbackUrl)}` : "";

    console.log(`[GitHub Auth] Initiating OAuth redirect to GitHub with redirectParam: ${redirectParam || "default app callback"}`);

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}${redirectParam}&scope=read:user%20user:email`;

    return res.redirect(githubAuthUrl);
  } catch (error) {
    console.error("GitHub Auth Error:", error);
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent("Failed to initialize GitHub login.")}`);
  }
};

// 4. GitHub Auth - Step 2: Callback from GitHub
export const githubCallback = async (req, res) => {
  try {
    const code = req.query.code || req.body?.code;
    const error = req.query.error || req.body?.error;
    const error_description = req.query.error_description || req.body?.error_description;

    const isJsonRequest = Boolean(req.headers.accept?.includes("application/json") || req.xhr || req.method === "POST");

    if (error || !code) {
      console.error("[GitHub Callback] Cancelled or error parameter:", error || error_description);
      const errMsg = error_description || error || "GitHub authentication was cancelled.";
      if (isJsonRequest) {
        return res.status(400).json({ error: errMsg });
      }
      return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(errMsg)}`);
    }

    const clientId = (process.env.GITHUB_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GITHUB_CLIENT_SECRET || "").trim();
    const customCallbackUrl = (process.env.GITHUB_CALLBACK_URL || "").trim();

    console.log("[GitHub Callback] Exchanging authorization code for access token...");

    let tokenData = null;

    // Step 2a: If customCallbackUrl is set, try with that redirect_uri first
    if (customCallbackUrl) {
      try {
        const tokenResponse = await axios.post(
          "https://github.com/login/oauth/access_token",
          {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: customCallbackUrl
          },
          {
            headers: { Accept: "application/json" }
          }
        );
        tokenData = tokenResponse.data;
      } catch (exchangeErr) {
        console.warn("[GitHub Callback] Custom redirect_uri exchange failed:", exchangeErr.message);
      }
    }

    // Step 2b: Standard token exchange without redirect_uri (GitHub uses its default callback)
    if (!tokenData || tokenData.error || !tokenData.access_token) {
      try {
        const retryResponse = await axios.post(
          "https://github.com/login/oauth/access_token",
          {
            client_id: clientId,
            client_secret: clientSecret,
            code
          },
          {
            headers: { Accept: "application/json" }
          }
        );
        if (retryResponse.data && !retryResponse.data.error) {
          tokenData = retryResponse.data;
        } else if (!tokenData) {
          tokenData = retryResponse.data;
        }
      } catch (retryErr) {
        console.warn("[GitHub Callback] Token exchange without redirect_uri failed:", retryErr.message);
      }
    }

    // Step 2c: Fallback with backend default callback URL if still failing
    if (!tokenData || tokenData.error || !tokenData.access_token) {
      try {
        const fallbackResponse = await axios.post(
          "https://github.com/login/oauth/access_token",
          {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${getBackendUrl()}/api/auth/github/callback`
          },
          {
            headers: { Accept: "application/json" }
          }
        );
        if (fallbackResponse.data && !fallbackResponse.data.error) {
          tokenData = fallbackResponse.data;
        }
      } catch (fbErr) {
        console.warn("[GitHub Callback] Fallback with backend URL failed:", fbErr.message);
      }
    }

    if (!tokenData || tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData?.error_description || tokenData?.error || "Failed to obtain GitHub access token.";
      console.error("[GitHub Callback] Token error:", errMsg);
      if (isJsonRequest) {
        return res.status(400).json({ error: errMsg });
      }
      return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(errMsg)}`);
    }

    const access_token = tokenData.access_token;

    // Get user profile from GitHub API
    console.log("[GitHub Callback] Fetching user profile from GitHub API...");
    const profileResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": "CRM-App"
      }
    });

    const githubUser = profileResponse.data;
    console.log("[GitHub Callback] GitHub profile fetched:", githubUser.login, "ID:", githubUser.id);
    let email = githubUser.email;

    // If email is private on GitHub profile, fetch from /user/emails
    if (!email) {
      try {
        console.log("[GitHub Callback] Profile email is null/private. Fetching /user/emails...");
        const emailsResponse = await axios.get("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "User-Agent": "CRM-App"
          }
        });

        const emails = Array.isArray(emailsResponse.data) ? emailsResponse.data : [];
        const primaryEmailObj =
          emails.find((e) => e.primary && e.verified) ||
          emails.find((e) => e.verified) ||
          emails[0];

        if (primaryEmailObj && primaryEmailObj.email) {
          email = primaryEmailObj.email;
          console.log("[GitHub Callback] Found verified email from /user/emails:", email);
        }
      } catch (emailErr) {
        console.warn("[GitHub Callback] Warning: Could not fetch user emails from GitHub:", emailErr.message);
      }
    }

    // Fallback: If no public/verified email, construct a safe unique noreply address
    if (!email) {
      email = `${githubUser.id}+${githubUser.login}@users.noreply.github.com`;
      console.log("[GitHub Callback] Using fallback noreply email:", email);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const githubIdStr = githubUser.id.toString();

    // Find user by either githubId or email
    let user = await User.findOne({
      $or: [{ githubId: githubIdStr }, { email: normalizedEmail }]
    });

    if (user) {
      console.log("[GitHub Callback] Existing user found in DB:", user.email);
      if (!user.githubId) user.githubId = githubIdStr;
      if (!user.name && (githubUser.name || githubUser.login)) {
        user.name = githubUser.name || githubUser.login;
      }
      if (!user.avatar && githubUser.avatar_url) {
        user.avatar = githubUser.avatar_url;
      }
      user.isVerified = true;
      await user.save();
    } else {
      console.log("[GitHub Callback] Creating new user in DB:", normalizedEmail);
      user = await User.create({
        email: normalizedEmail,
        name: githubUser.name || githubUser.login || "",
        avatar: githubUser.avatar_url || "",
        provider: "github",
        githubId: githubIdStr,
        isVerified: true,
        role: "customer"
      });
    }

    return handleOAuthSuccess(res, user, req);
  } catch (err) {
    console.error("GitHub OAuth Callback Error:", err.response?.data || err.message);
    const errorMessage =
      err.response?.data?.error_description || err.message || "Failed to authenticate with GitHub.";
    if (req.headers.accept?.includes("application/json") || req.xhr || req.method === "POST") {
      return res.status(500).json({ error: errorMessage });
    }
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(errorMessage)}`);
  }
};

