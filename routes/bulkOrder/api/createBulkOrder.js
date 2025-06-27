import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import BulkOrder from "../../../models/bulkOrder.js";

const createBulkOrder = express.Router();

createBulkOrder.post("/", authenticateUser, async (req, res) => {
  try {
    const bulkOrder = new BulkOrder({
      ...req.body,
      user: req.user.id,
    });

    const saved = await bulkOrder.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Bulk order creation error:", err);
    res.status(400).json({ error: err.message });
  }
});

export default createBulkOrder;
//buyer submit 