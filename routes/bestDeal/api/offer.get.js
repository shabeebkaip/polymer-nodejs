import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import getSellerBestDeals from "../aggregations/getSellerBestDeals.js";

const listBestDeals = express.Router();

listBestDeals.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // pending, approved, rejected

    const bestDeals = await getSellerBestDeals(sellerId);

    // Apply status filter if provided
    let filteredDeals = bestDeals;
    if (status && status !== 'all') {
      filteredDeals = bestDeals.filter(deal => deal.status === status);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedDeals = filteredDeals.slice(skip, skip + limit);

    // Format the response
    const formattedDeals = paginatedDeals.map(deal => ({
      id: deal._id,
      offerPrice: deal.offerPrice,
      status: deal.status,
      adminNote: deal.adminNote,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      product: {
        id: deal.productDetails._id,
        productName: deal.productDetails.productName,
        chemicalName: deal.productDetails.chemicalName,
        tradeName: deal.productDetails.tradeName,
        description: deal.productDetails.description,
        productImages: deal.productDetails.productImages || [],
        originalPrice: deal.productDetails.price,
        stock: deal.productDetails.stock,
        uom: deal.productDetails.uom,
        minimumOrderQuantity: deal.productDetails.minimum_order_quantity,
        countryOfOrigin: deal.productDetails.countryOfOrigin,
        color: deal.productDetails.color,
        specifications: {
          density: deal.productDetails.density,
          mfi: deal.productDetails.mfi,
          tensileStrength: deal.productDetails.tensileStrength,
          elongationAtBreak: deal.productDetails.elongationAtBreak,
          shoreHardness: deal.productDetails.shoreHardness,
          waterAbsorption: deal.productDetails.waterAbsorption
        },
        certifications: {
          recyclable: deal.productDetails.recyclable,
          bioDegradable: deal.productDetails.bioDegradable,
          fdaApproved: deal.productDetails.fdaApproved,
          medicalGrade: deal.productDetails.medicalGrade
        },
        storage: {
          conditions: deal.productDetails.storageConditions,
          shelfLife: deal.productDetails.shelfLife,
          packagingWeight: deal.productDetails.packagingWeight
        }
      },
      dealInfo: {
        discountPercentage: deal.productDetails.price ? 
          Math.round(((deal.productDetails.price - deal.offerPrice) / deal.productDetails.price) * 100) : 0,
        savings: deal.productDetails.price ? 
          (deal.productDetails.price - deal.offerPrice) : 0,
        isActive: deal.status === 'approved',
        statusIcon: getStatusIcon(deal.status)
      }
    }));

    // Calculate summary statistics
    const summary = {
      total: filteredDeals.length,
      active: filteredDeals.filter(deal => deal.status === 'approved').length,
      pending: filteredDeals.filter(deal => deal.status === 'pending').length,
      rejected: filteredDeals.filter(deal => deal.status === 'rejected').length
    };

    res.status(200).json({
      success: true,
      message: "Best deals retrieved successfully",
      data: formattedDeals,
      meta: {
        pagination: {
          page,
          limit,
          total: filteredDeals.length,
          totalPages: Math.ceil(filteredDeals.length / limit),
          hasNext: page * limit < filteredDeals.length,
          hasPrev: page > 1
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
