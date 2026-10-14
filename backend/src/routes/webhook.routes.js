import express from "express";
import { verifyMetaWebhook, handleMetaWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

/**
 * Meta (Facebook & Instagram) Graph API Leadgen Webhook
 * GET /api/webhooks/meta   -> Hub challenge verification
 * POST /api/webhooks/meta  -> Real-time lead capture
 */
router.get("/meta", verifyMetaWebhook);
router.post("/meta", handleMetaWebhook);

export default router;
