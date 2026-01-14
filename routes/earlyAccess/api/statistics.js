import express from "express";
import earlyAccessService from "../../../services/earlyAccess.service.js";
import { verifyToken } from "../../../middlewares/verify.token.js";

const statisticsRouter = express.Router();

// Admin only - get early access statistics
statisticsRouter.get("/", verifyToken, async (req, res) => {
  try {
    const result = await earlyAccessService.getStatistics();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching early access statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

export default statisticsRouter;
