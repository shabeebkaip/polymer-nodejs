import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import BestDeal from "../../../models/bestDeal.js";

const listBestDeals = express.Router();

listBestDeals.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // pending, approved, rejected

    // Build query
    let query = { sellerId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get total count for pagination
    const total = await BestDeal.countDocuments(query);

    // Apply pagination and populate
    const skip = (page - 1) * limit;
    const bestDeals = await BestDeal.find(query)
      .populate('productId', '_id productName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Format the response - spread deal info at root level
    const formattedDeals = bestDeals.map(deal => {
      const dealObj = deal.toObject();
      
      return {
        id: dealObj._id,
        productId: dealObj.productId?._id,
        productName: dealObj.productId?.productName,
        offerPrice: dealObj.offerPrice,
        validity: dealObj.validity,
        isExpired: dealObj.validity ? new Date(dealObj.validity) < new Date() : false,
        status: dealObj.status,
        adminNote: dealObj.adminNote,
        createdAt: dealObj.createdAt,
        updatedAt: dealObj.updatedAt,
        isActive: dealObj.status === 'approved' && (!dealObj.validity || new Date(dealObj.validity) >= new Date()),
        statusIcon: getStatusIcon(dealObj.status)
      };
    });

    // Calculate summary statistics
    const allDeals = await BestDeal.find({ sellerId });
    const summary = {
      total: allDeals.length,
      active: allDeals.filter(deal => deal.status === 'approved').length,
      pending: allDeals.filter(deal => deal.status === 'pending').length,
      rejected: allDeals.filter(deal => deal.status === 'rejected').length
    };

    res.status(200).json({
      success: true,
      message: "Best deals retrieved successfully",
      data: formattedDeals,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: formattedDeals.length,
          limit
        },
        filters: {
          status: status || 'all'
        },
        summary
      }
    });
  } catch (err) {
    console.error("Error fetching best deals:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch best deals",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

// Helper function to get status icon
function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌'
  };
  return icons[status] || '❓';
}

export default listBestDeals;
