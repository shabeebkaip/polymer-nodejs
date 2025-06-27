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

    // Format the response to include status tracking information
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        statusTracking: {
          adminStatus: orderObj.status, // pending, approved, rejected
          sellerStatus: orderObj.sellerStatus, // seller's status updates
          lastUpdate: orderObj.statusMessage.length > 0 
            ? orderObj.statusMessage[orderObj.statusMessage.length - 1].date 
            : orderObj.updatedAt,
          totalUpdates: orderObj.statusMessage.length
        }
      };
    });

    res.status(200).json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length
    });
  } catch (err) {
    console.error("Error fetching user's bulk orders:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch user's bulk orders" 
    });
  }
});

export default getUserBulkOrders;