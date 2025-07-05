import express from 'express';
import BestDeal from '../../../models/bestDeal.js';
import { authenticateUser } from '../../../middlewares/verify.token.js';
import UnifiedQuoteRequest from '../../../models/unifiedQuoteRequest.js';

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
    // Get all deal quote requests for this best deal using unified model
    const dealQuoteRequests = await UnifiedQuoteRequest.find({ 
      bestDealId: id,
      requestType: "deal_quote"
    })
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "bestDealId",
        select: "productId sellerId offerPrice status",
        populate: {
          path: "productId",
          select: "productName chemicalName tradeName"
        }
      })
      .sort({ createdAt: -1 });

    // Format quote requests for unified response
    const formattedQuoteRequests = dealQuoteRequests.map(request => {
      const requestObj = request.toObject();
      return {
        id: requestObj._id,
        requestType: requestObj.requestType,
        buyer: requestObj.buyerId ? {
          id: requestObj.buyerId._id,
          name: `${requestObj.buyerId.firstName} ${requestObj.buyerId.lastName}`,
          email: requestObj.buyerId.email,
          phone: requestObj.buyerId.phone,
          company: requestObj.buyerId.company,
          location: `${requestObj.buyerId.city || ''}, ${requestObj.buyerId.country || ''}`.replace(/^, |, $/, ''),
          userType: requestObj.buyerId.userType
        } : null,
        dealDetails: {
          desiredQuantity: requestObj.desiredQuantity,
          shippingCountry: requestObj.shippingCountry,
          paymentTerms: requestObj.paymentTerms,
          deliveryDeadline: requestObj.deliveryDeadline,
          message: requestObj.message
        },
        status: requestObj.status,
        statusHistory: requestObj.statusMessage || [],
        timeline: {
          requested: requestObj.createdAt,
          lastUpdate: requestObj.updatedAt,
          deadline: requestObj.deliveryDeadline
        },
        createdAt: requestObj.createdAt,
        updatedAt: requestObj.updatedAt
      };
    });

    // Format the response to include comprehensive deal information
    const dealObj = bestDeal.toObject();
    const formattedDeal = {
      id: dealObj._id,
      productId: dealObj.productId?._id,
      sellerId: dealObj.sellerId?._id,
      offerPrice: dealObj.offerPrice,
      status: dealObj.status,
      adminNote: dealObj.adminNote,
      createdAt: dealObj.createdAt,
      updatedAt: dealObj.updatedAt,
      seller: dealObj.sellerId ? {
        id: dealObj.sellerId._id,
        name: `${dealObj.sellerId.firstName} ${dealObj.sellerId.lastName}`,
        email: dealObj.sellerId.email,
        phone: dealObj.sellerId.phone,
        company: dealObj.sellerId.company,
        location: `${dealObj.sellerId.city || ''}, ${dealObj.sellerId.country || ''}`.replace(/^, |, $/, ''),
        address: {
          full: dealObj.sellerId.address,
          city: dealObj.sellerId.city,
          state: dealObj.sellerId.state,
          country: dealObj.sellerId.country,
          pincode: dealObj.sellerId.pincode
        },
        userType: dealObj.sellerId.userType
      } : null,
      product: dealObj.productId ? {
        id: dealObj.productId._id,
        productName: dealObj.productId.productName,
        chemicalName: dealObj.productId.chemicalName,
        tradeName: dealObj.productId.tradeName,
        description: dealObj.productId.description,
        productImages: dealObj.productId.productImages || [],
        countryOfOrigin: dealObj.productId.countryOfOrigin,
        color: dealObj.productId.color,
        manufacturingMethod: dealObj.productId.manufacturingMethod,
        specifications: {
          density: dealObj.productId.density,
          mfi: dealObj.productId.mfi,
          tensileStrength: dealObj.productId.tensileStrength,
          elongationAtBreak: dealObj.productId.elongationAtBreak,
          shoreHardness: dealObj.productId.shoreHardness,
          waterAbsorption: dealObj.productId.waterAbsorption
        },
        creator: dealObj.productId.createdBy ? {
          id: dealObj.productId.createdBy._id,
          name: `${dealObj.productId.createdBy.firstName} ${dealObj.productId.createdBy.lastName}`,
          company: dealObj.productId.createdBy.company,
          email: dealObj.productId.createdBy.email
        } : null
      } : null,
      statusTracking: {
        adminStatus: dealObj.status, // pending, approved, rejected
        lastUpdate: dealObj.updatedAt,
        totalRequests: formattedQuoteRequests.length,
        requestBreakdown: {
          pending: formattedQuoteRequests.filter(req => req.status === 'pending').length,
          accepted: formattedQuoteRequests.filter(req => req.status === 'accepted').length,
          rejected: formattedQuoteRequests.filter(req => req.status === 'rejected').length,
          completed: formattedQuoteRequests.filter(req => req.status === 'completed').length
        }
      }
    };

    res.status(200).json({
      success: true,
      message: "Best deal details and quote requests retrieved successfully",
      data: {
        deal: formattedDeal,
        quoteRequests: formattedQuoteRequests,
        summary: {
          totalQuoteRequests: formattedQuoteRequests.length,
          dealStatus: dealObj.status,
          isActive: dealObj.status === 'approved',
          recentRequests: formattedQuoteRequests.slice(0, 5) // Last 5 requests
        }
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
