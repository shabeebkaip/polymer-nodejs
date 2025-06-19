import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminVerifyBulkOrder = express.Router();

adminVerifyBulkOrder.patch("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["pending", "approved", "rejected"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const updated = await BulkOrder.findByIdAndUpdate(id, { status }, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Bulk order not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Bulk order ${status} successfully.`,
      data: updated,
    });
  } catch (err) {
    console.error("Bulk order update error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update bulk order status.",
      error: err.message,
    });
  }
});

export default adminVerifyBulkOrder;
