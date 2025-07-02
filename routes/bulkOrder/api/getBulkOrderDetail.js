import express from 'express';
import BulkOrder from '../../../models/bulkOrder.js';
import { authenticateUser } from '../../../middlewares/verify.token.js';

const getBulkOrderDetail = express.Router();

getBulkOrderDetail.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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


    // Fetch the bulk order by ID and populate references (do not filter by user)
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

    // Access control: Buyer can see only their own order; any seller can see all bulk order details
    const isBuyer = bulkOrder.user && bulkOrder.user._id && bulkOrder.user._id.toString() === userId;
    const isSeller = req.user.user_type === 'seller' || req.user.userType === 'seller';
    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this bulk order detail",
        error: {
          code: "FORBIDDEN",
          details: "Only the buyer (owner) or any seller can access bulk order details"
        }
      });
    }

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
      message: "Bulk order details retrieved successfully",
      data: formattedOrder,
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
}); 

export default getBulkOrderDetail;
