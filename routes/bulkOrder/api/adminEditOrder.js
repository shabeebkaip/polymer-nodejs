import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const editBulkOrderByAdmin = express.Router();

editBulkOrderByAdmin.put("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedOrder = await BulkOrder.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ error: "Bulk order not found" });
    }

    res.status(200).json({ message: "Bulk order updated successfully", data: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: "Failed to update bulk order" });
  }
});

export default editBulkOrderByAdmin;
