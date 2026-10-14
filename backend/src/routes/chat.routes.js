import { Router } from "express";
import {
  initConversation,
  getConversationMessages,
  getAgentQueue,
  submitChatReport,
  getManagerChatReports,
  getFullTranscript,
  sendMessageREST
} from "../controllers/chat.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(optionalAuth);

// Customer endpoints
router.post("/init", initConversation);
router.get("/conversations/:id/messages", getConversationMessages);
router.post("/send", sendMessageREST);

// Agent endpoints
router.get("/agent/queue", getAgentQueue);
router.post("/conversations/:id/report", submitChatReport);
router.post("/conversations/:id/submit-report", submitChatReport);

// Manager endpoints
router.get("/manager/reports", getManagerChatReports);
router.get("/manager/chat-reports", getManagerChatReports);
router.get("/manager/transcripts/:id", getFullTranscript);

export default router;
