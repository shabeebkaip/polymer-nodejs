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

getAllBulkOrders.get("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid bulk order ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid bulk order ID"
        }
      });
    }

    // Fetch the bulk order by ID and populate references
    const bulkOrder = await BulkOrder.findOne({ _id: id })
      .populate({
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      });

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
        error: {
          code: "NOT_FOUND",
          details: "The requested bulk order does not exist"
        }
      });
    }

    // Get all supplier offers for this bulk order
    const SupplierOfferRequest = (await import("../../../models/supplierOfferRequest.js")).default;
    const offers = await SupplierOfferRequest.find({ bulkOrderId: id })
      .populate("supplierId", "firstName lastName email company")
      .populate({
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date"
      })
      .sort({ createdAt: -1 });

    // Format the response to include status tracking information
    const orderObj = bulkOrder.toObject();
    const formattedOrder = {
      ...orderObj,
      statusTracking: {
        adminStatus: orderObj.status, // pending, approved, rejected
        sellerStatus: orderObj.sellerStatus, // seller's status updates
        lastUpdate: orderObj.statusMessage.length > 0
          ? orderObj.statusMessage[orderObj.statusMessage.length - 1].date
          : orderObj.updatedAt,
        totalUpdates: orderObj.statusMessage.length,
        statusHistory: orderObj.statusMessage || []
      }
    };

    res.status(200).json({
      success: true,
      message: "Bulk order details and supplier offers retrieved successfully",
      data: {
        order: formattedOrder,
        offers
      }
    });

  } catch (error) {
    console.error("Error fetching bulk order detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch bulk order details",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
}) 

export default getAllBulkOrders;
