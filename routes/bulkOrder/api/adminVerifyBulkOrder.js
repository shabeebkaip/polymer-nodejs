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
      return res.status(400).json({ error: "Invalid status." });
    }

    const updated = await BulkOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Bulk order not found." });
    }

    res.status(200).json({ message: "Status updated.", data: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update bulk order status." });
  }
});

export default adminVerifyBulkOrder;