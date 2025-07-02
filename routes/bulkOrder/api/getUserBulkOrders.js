import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import BulkOrder from "../../../models/bulkOrder.js";

const getUserBulkOrders = express.Router();

getUserBulkOrders.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = { user: userId };

    // Add search filters
    if (search) {
      searchQuery.$or = [
        { "deliveryAddress": { $regex: search, $options: "i" } },
        { "country": { $regex: search, $options: "i" } },
        { "city": { $regex: search, $options: "i" } },
        { "state": { $regex: search, $options: "i" } },
        { "notes": { $regex: search, $options: "i" } }
      ];
    }

    // Add status filter
    if (status) {
      searchQuery.status = status;
    }

    const total = await BulkOrder.countDocuments(searchQuery);

    const orders = await BulkOrder.find(searchQuery)
      .populate({
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "product", 
        select: "productName createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName company email",
        },
      })
      .skip(skip)
      .limit(limit)
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
      message: "Bulk orders retrieved successfully",
      data: formattedOrders,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: formattedOrders.length,
          limit
        },
        filters: {
          search,
          status
        }
      }
    });
  } catch (err) {
    console.error("Error fetching user's bulk orders:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user's bulk orders",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

export default getUserBulkOrders;