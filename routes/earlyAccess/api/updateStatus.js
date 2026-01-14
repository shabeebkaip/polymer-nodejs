import express from "express";
import earlyAccessService from "../../../services/earlyAccess.service.js";
import { verifyToken } from "../../../middlewares/verify.token.js";

const updateStatusRouter = express.Router();

// Admin only - update early access request status
updateStatusRouter.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    const validStatuses = ["pending", "contacted", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const result = await earlyAccessService.updateStatus(id, status, notes);

    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error updating early access status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
});

export default updateStatusRouter;
