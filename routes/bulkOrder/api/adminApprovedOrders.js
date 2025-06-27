import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";

const getApprovedBulkOrders = express.Router();

getApprovedBulkOrders.get("/", async (req, res) => {
  try {
    const approvedOrders = await BulkOrder.find({ status: "approved" })
      .populate("product", "productName")
      .populate("user", "firstName lastName company")
      .sort({ createdAt: -1 });

    const formatted = approvedOrders.map((order) => {
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
      count: formatted.length 
    });
  } catch (err) {
    console.error("Approved bulk order fetch error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch approved bulk orders" 
    });
  }
});

export default getApprovedBulkOrders;