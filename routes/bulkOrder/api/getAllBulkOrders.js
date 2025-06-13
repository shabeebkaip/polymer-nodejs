import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const getAllBulkOrders = express.Router();

getAllBulkOrders.get("/", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const orders = await BulkOrder.find()
      .populate("product", "productName")
      .populate("user", "firstName lastName email company")
      .sort({ createdAt: -1 });

    const formatted = orders.map((order) => {
      const obj = order.toObject();
      if (obj.user) {
        obj.user.name = `${obj.user.firstName} ${obj.user.lastName}`;
        delete obj.user.firstName;
        delete obj.user.lastName;
      }
      return obj;
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all bulk orders" });
  }
});

export default getAllBulkOrders;