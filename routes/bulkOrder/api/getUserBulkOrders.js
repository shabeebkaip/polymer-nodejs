import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import BulkOrder from "../../../models/bulkOrder.js";

const getUserBulkOrders = express.Router();

getUserBulkOrders.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await BulkOrder.find({ user: userId })
      .populate("product", "productName")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user's bulk orders" });
  }
});

export default getUserBulkOrders;