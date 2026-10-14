import { Router } from "express";
import { getCustomerAssignedAgent } from "../controllers/customer.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(optionalAuth);

// GET /api/customer/agent - Fetch real assigned agent (sufyan@gmail.com) and products/services they are selling
router.get("/agent", getCustomerAssignedAgent);

export default router;
