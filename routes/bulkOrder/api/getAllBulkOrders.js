import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const getAllBulkOrders = express.Router();

getAllBulkOrders.get("/", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await BulkOrder.countDocuments();

    const orders = await BulkOrder.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("product", "productName")
      .populate("user", "firstName lastName email company")

    const formatted = orders.map((order) => {
      const obj = order.toObject();
      if (obj.user) {
        obj.user.name = `${obj.user.firstName} ${obj.user.lastName}`;
        delete obj.user.firstName;
        delete obj.user.lastName;
      }
      return obj;
    });

    res.status(200).json({ 
      success: true, 
      data: formatted, 
      total: totalOrders,
      page,
      totalPages: Math.ceil(totalOrders / limit), });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all bulk orders" });
  }
});

export default getAllBulkOrders;
