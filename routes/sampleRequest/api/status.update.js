import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const updateSampleStatus = express.Router();

updateSampleStatus.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("seller"), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ["pending", "approved", "rejected", "fulfilled", "responded", "sent", "delivered", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value provided." });
      }

      const updatedRequest = await SampleRequest.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: "Sample request not found." });
      }

      res.status(200).json({
        success: true,
        message: `Sample request status updated to '${status}' successfully.`,
        data: updatedRequest,
      });
    } catch (err) {
      console.error("Error updating Sample request status:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update sample request status due to an internal server error.",
        error: err.message,
      });
    }
  }
);

export default updateSampleStatus;
