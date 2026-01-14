import express from "express";
import earlyAccessService from "../../../services/earlyAccess.service.js";
import { verifyToken } from "../../../middlewares/verify.token.js";

const listEarlyAccessRouter = express.Router();

// Admin only - list all early access requests
listEarlyAccessRouter.get("/", verifyToken, async (req, res) => {
  try {
    const { status, userType, page, limit, search } = req.query;

    const result = await earlyAccessService.getAllRequests({
      status,
      userType,
      page: page || 1,
      limit: limit || 50,
      search,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching early access requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch early access requests",
    });
  }
});

export default listEarlyAccessRouter;
