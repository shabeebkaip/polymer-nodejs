import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminCreateBulkOrder = express.Router();

adminCreateBulkOrder.post("/", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const order = new BulkOrder(req.body); // admin must pass required fields including user
    const saved = await order.save();
    res.status(201).json({ message: "Bulk order created successfully", data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default adminCreateBulkOrder;
