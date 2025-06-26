import express from "express";
import QuoteRequest from "../../../models/quoteRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const updateQuoteStatus = express.Router();

updateQuoteStatus.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("seller"), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ["pending", "approved", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value provided." });
      }

      const updatedRequest = await QuoteRequest.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: "Quote request not found." });
      }

      res.status(200).json({
        success: true,
        message: `Quote request status updated to '${status}' successfully.`,
        data: updatedRequest,
      });
    } catch (err) {
      console.error("Error updating Quote request status:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update quote request status due to an internal server error.",
        error: err.message,
      });
    }
  }
);

export default updateQuoteStatus;
