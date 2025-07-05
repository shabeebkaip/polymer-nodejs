import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";

const getUserQuotes = express.Router();

// Helper functions for unified fields
const getStatusIcon = (status) => {
  const icons = {
    pending: '⏳',
    responded: '💬',
    negotiation: '🤝',
    accepted: '✅',
    in_progress: '🔄',
    shipped: '🚚',
    delivered: '📦',
    completed: '🎉',
    rejected: '❌',
    cancelled: '🚫'
  };
  return icons[status] || '❓';
};

const getPriorityLevel = (deliveryDate) => {
  if (!deliveryDate) return 'normal';
  
  const now = new Date();
  const delivery = new Date(deliveryDate);
  const daysUntilDelivery = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDelivery <= 7) return 'urgent';
  if (daysUntilDelivery <= 14) return 'high';
  if (daysUntilDelivery <= 30) return 'medium';
  return 'normal';
};

getUserQuotes.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const requestType = req.query.type || ""; // "product_quote" or "deal_quote" or ""

    const skip = (page - 1) * limit;

    // Build search query for unified model - only use buyerId field
    let searchQuery = { 
      buyerId: userId // Unified field for all quote types
    };

    // Add request type filter
    if (requestType) {
      searchQuery.requestType = requestType;
    }

    // Add search filters - updated for unified fields
    if (search) {
      const searchFilters = {
        $or: [
          // Product quote fields
          { "destination": { $regex: search, $options: "i" } },
          { "country": { $regex: search, $options: "i" } },
          { "application": { $regex: search, $options: "i" } },
          { "message": { $regex: search, $options: "i" } },
          { "terms": { $regex: search, $options: "i" } },
          { "packaging_size": { $regex: search, $options: "i" } },
          { "lead_time": { $regex: search, $options: "i" } },
          // Deal quote fields
          { "shippingCountry": { $regex: search, $options: "i" } },
          { "paymentTerms": { $regex: search, $options: "i" } }
        ]
      };
      
      searchQuery = {
        $and: [
          searchQuery,
          searchFilters
        ]
      };
    }

    // Add status filter
    if (status) {
      if (searchQuery.$and) {
        searchQuery.$and.push({ status });
      } else {
        searchQuery.status = status;
      }
    }

    const total = await UnifiedQuoteRequest.countDocuments(searchQuery);

    const userRequests = await UnifiedQuoteRequest.find(searchQuery)
      .populate({
        path: "product",
        select: "productName createdBy", 
        populate: {
          path: "createdBy",
          select: "firstName lastName company email", 
        },
      })
      .populate({
        path: "bestDealId",
        select: "offerPrice status",
        populate: {
          path: "productId",
          select: "productName"
        }
      })
      .populate({ path: "grade", select: "name" })   
      .populate({ path: "incoterm", select: "name" })
      .populate({ path: "packagingType", select: "name" })
      .populate({ path: "buyerId", select: "firstName lastName company email" }) // Only buyerId, remove user
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Format the response to handle both quote types
    const formattedRequests = userRequests.map(request => {
      const requestObj = request.toObject();
      
      // Base data common to both types
      const baseData = {
        _id: requestObj._id,
        requestType: requestObj.requestType,
        status: requestObj.status,
        message: requestObj.message,
        createdAt: requestObj.createdAt,
        updatedAt: requestObj.updatedAt,
        statusMessage: requestObj.statusMessage || []
      };

      // Type-specific formatting
      if (requestObj.requestType === 'product_quote') {
        return {
          ...baseData,
          quoteType: 'Product Quote',
          product: requestObj.product,
          buyer: requestObj.buyerId, // Use buyerId instead of user
          quantity: requestObj.quantity,
          uom: requestObj.uom,
          destination: requestObj.destination,
          country: requestObj.country,
          delivery_date: requestObj.delivery_date,
          application: requestObj.application,
          terms: requestObj.terms,
          packaging_size: requestObj.packaging_size,
          lead_time: requestObj.lead_time,
          grade: requestObj.grade,
          incoterm: requestObj.incoterm,
          packagingType: requestObj.packagingType,
          // Unified fields for easier frontend handling
          unified: {
            quantity: requestObj.quantity,
            deliveryDate: requestObj.delivery_date,
            location: requestObj.country,
            productInfo: requestObj.product?.productName || 'Product Quote',
            type: 'product_quote',
            title: requestObj.product?.productName || 'Product Quote',
            statusIcon: getStatusIcon(requestObj.status),
            priorityLevel: getPriorityLevel(requestObj.delivery_date)
          }
        };
      } else {
        // deal_quote
        return {
          ...baseData,
          quoteType: 'Deal Quote',
          bestDeal: requestObj.bestDealId,
          buyer: requestObj.buyerId,
          desiredQuantity: requestObj.desiredQuantity,
          shippingCountry: requestObj.shippingCountry,
          paymentTerms: requestObj.paymentTerms,
          deliveryDeadline: requestObj.deliveryDeadline,
          // Unified fields for easier frontend handling
          unified: {
            quantity: requestObj.desiredQuantity,
            deliveryDate: requestObj.deliveryDeadline,
            location: requestObj.shippingCountry,
            productInfo: requestObj.bestDealId?.productId?.productName || 'Deal Quote',
            type: 'deal_quote',
            title: requestObj.bestDealId?.productId?.productName || 'Deal Quote',
            statusIcon: getStatusIcon(requestObj.status),
            priorityLevel: getPriorityLevel(requestObj.deliveryDeadline)
          }
        };
      }
    });

    // Calculate summary statistics
    const summary = {
      totalRequests: total,
      productQuotes: formattedRequests.filter(req => req.requestType === 'product_quote').length,
      dealQuotes: formattedRequests.filter(req => req.requestType === 'deal_quote').length,
      statusBreakdown: {
        pending: formattedRequests.filter(req => req.status === 'pending').length,
        responded: formattedRequests.filter(req => req.status === 'responded').length,
        negotiation: formattedRequests.filter(req => req.status === 'negotiation').length,
        accepted: formattedRequests.filter(req => req.status === 'accepted').length,
        in_progress: formattedRequests.filter(req => req.status === 'in_progress').length,
        shipped: formattedRequests.filter(req => req.status === 'shipped').length,
        delivered: formattedRequests.filter(req => req.status === 'delivered').length,
        completed: formattedRequests.filter(req => req.status === 'completed').length,
        rejected: formattedRequests.filter(req => req.status === 'rejected').length,
        cancelled: formattedRequests.filter(req => req.status === 'cancelled').length
      },
      priorityBreakdown: {
        urgent: formattedRequests.filter(req => req.unified?.priorityLevel === 'urgent').length,
        high: formattedRequests.filter(req => req.unified?.priorityLevel === 'high').length,
        medium: formattedRequests.filter(req => req.unified?.priorityLevel === 'medium').length,
        normal: formattedRequests.filter(req => req.unified?.priorityLevel === 'normal').length
      }
    };

    res.status(200).json({
      success: true,
      message: "Quote requests retrieved successfully",
      data: formattedRequests,
      meta: {
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          count: formattedRequests.length,
          limit
        },
        filters: {
          search,
          status,
          requestType: requestType || 'all'
        },
        summary
      }
    });
  } catch (err) {
    console.error("Error fetching unified quote requests:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote requests",
      error: {
        code: "FETCH_ERROR",
        details: err.message
      }
    });
  }
});

export default getUserQuotes;
