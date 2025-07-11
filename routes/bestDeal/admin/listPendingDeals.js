import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listBestDeals = express.Router();

listBestDeals.get(
  "/",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalDeals = await BestDeal.countDocuments();

      const bestDeals = await BestDeal.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("productId", "productName price productImages")
        .populate("sellerId", "firstName lastName email user_type");

      const formatted = bestDeals.map((deal) => {
        const obj = deal.toObject();
        if (obj.sellerId) {
          obj.sellerId.name = `${obj.sellerId.firstName} ${obj.sellerId.lastName}`;
          delete obj.sellerId.firstName;
          delete obj.sellerId.lastName;
        }
        return obj;
      });

      res.status(200).json({
        success: true,
        data: formatted,
        total: totalDeals,
        page,
        totalPages: Math.ceil(totalDeals / limit),
      });
    } catch (err) {
      console.error("Error fetching best deals:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

listBestDeals.get("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const { id } = req.params;

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

    // Get all deal quote requests for this best deal
    const DealQuoteRequest = (await import("../../../models/dealQuoteRequest.js")).default;
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
})



export default listBestDeals;
