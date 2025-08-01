import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";
import Notification from "../../../models/notification.js";
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

      // Notify the buyer (requester) about status update
      if (updatedRequest.user) {
        try {
          await Notification.create({
            userId: updatedRequest.user,
            type: 'sample-status',
            message: `Status updated to '${status}' for your sample request.`,
            redirectUrl: `/user/sample-requests/${updatedRequest._id}`,
            relatedId: updatedRequest._id,
            meta: {
              status
            }
          });
        } catch (notifyErr) {
          console.error('Failed to notify buyer for sample status update:', notifyErr);
        }
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
