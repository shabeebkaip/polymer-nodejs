import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateUser, authorizeRoles } from "../../middlewares/verify.token.js";
import { parseUpload, getParseSession } from "../../controllers/ai.controller.js";

const router = express.Router();

const guard = [authenticateUser, authorizeRoles("seller", "superAdmin")];

const parseRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many parse requests. Try again in a minute." },
});

router.post("/parse", parseRateLimit, ...guard, parseUpload);
router.get("/session/:id", ...guard, getParseSession);

export default router;
