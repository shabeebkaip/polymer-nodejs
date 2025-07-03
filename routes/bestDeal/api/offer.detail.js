import express from 'express';
import BestDeal from '../../../models/bestDeal.js';
import DealQuoteRequest from '../../../models/dealQuoteRequest.js';
import { authenticateUser } from '../../../middlewares/verify.token.js';

const getBestDealDetail = express.Router();

getBestDealDetail.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid best deal ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid best deal ID"
        }
      });
    }

    // Fetch the best deal by ID and populate references
    const bestDeal = await BestDeal.findOne({ _id: id })
      .populate({
        path: "sellerId",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "productId",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      });

    if (!bestDeal) {
      return res.status(404).json({
        success: false,
        message: "Best deal not found",
        error: {
          code: "NOT_FOUND",
          details: "The requested best deal does not exist"
        }
      });
    }

    // Access control: Seller can see only their own deals; any buyer can see all best deal details
    const isSeller = bestDeal.sellerId && bestDeal.sellerId._id && bestDeal.sellerId._id.toString() === userId;
    const isBuyer = req.user.user_type === 'buyer' || req.user.userType === 'buyer';
    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this best deal detail",
        error: {
          code: "FORBIDDEN",
          details: "Only the seller (owner) or any buyer can access best deal details"
        }
      });
    }

    // Get all deal quote requests for this best deal
    const dealQuoteRequests = await DealQuoteRequest.find({ bestDealId: id })
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "bestDealId",
        select: "productId sellerId offerPrice status"
      })
      .sort({ createdAt: -1 });

    // Format the response to include status tracking information
    const dealObj = bestDeal.toObject();
    const formattedDeal = {
      ...dealObj,
      statusTracking: {
        adminStatus: dealObj.status, // pending, approved, rejected
        lastUpdate: dealObj.updatedAt,
        totalRequests: dealQuoteRequests.length
      }
    };

    res.status(200).json({
      success: true,
      message: "Best deal details and quote requests retrieved successfully",
      data: {
        deal: formattedDeal,
        quoteRequests: dealQuoteRequests
      }
    });

  } catch (error) {
    console.error("Error fetching best deal detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch best deal details",
      error: {
        code: "FETCH_ERROR",
        details: error.message
      }
    });
  }
}); 

export default getBestDealDetail;
