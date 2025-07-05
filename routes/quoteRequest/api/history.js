import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";

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

getUserQuotes.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid quote request ID format",
        error: {
          code: "INVALID_ID",
          details: "Please provide a valid quote request ID"
        }
      });
    }

    // Find quote request - only use buyerId field for unified model
    const quoteRequest = await UnifiedQuoteRequest.findOne({ 
      _id: id,
      buyerId: userId // Only use buyerId field
    })
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy",
        populate: {
          path: "createdBy",
          select: "firstName lastName email phone company address city state country",
        }
      })
      .populate({
        path: "bestDealId",
        select: "offerPrice status adminNote createdAt dealPrice originalPrice title description",
        populate: {
          path: "productId",
          select: "productName chemicalName tradeName productImages countryOfOrigin color"
        }
      })
      .populate({
        path: "grade",
        select: "name description",
      })
      .populate({
        path: "incoterm",
        select: "name description",
      })
      .populate({
        path: "packagingType",
        select: "name description",
      });

    if (!quoteRequest) {
      return res.status(404).json({ 
        success: false,
        message: "Quote request not found",
        error: {
          code: "NOT_FOUND",
          details: "The requested quote request does not exist or you don't have permission to access it"
        }
      });
    }

    // Format response using helper
    const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(quoteRequest);
    
    // Enhanced response structure matching main detail router
    const responseData = {
      _id: formattedResponse.id,
      requestType: formattedResponse.requestType,
      status: formattedResponse.status,
      message: formattedResponse.message,
      createdAt: formattedResponse.createdAt,
      updatedAt: formattedResponse.updatedAt,
      statusHistory: formattedResponse.statusMessage || [],
      
      // User information (buyer/requester)
      requester: formattedResponse.buyerId ? {
        _id: formattedResponse.buyerId._id,
        name: `${formattedResponse.buyerId.firstName} ${formattedResponse.buyerId.lastName}`,
        email: formattedResponse.buyerId.email,
        phone: formattedResponse.buyerId.phone,
        company: formattedResponse.buyerId.company,
        address: {
          full: formattedResponse.buyerId.address,
          city: formattedResponse.buyerId.city,
          state: formattedResponse.buyerId.state,
          country: formattedResponse.buyerId.country,
          pincode: formattedResponse.buyerId.pincode
        },
        userType: formattedResponse.buyerId.userType
      } : null,
      
      // Type-specific data
      ...(formattedResponse.requestType === 'product_quote' ? {
        quoteType: 'Product Quote',
        product: formattedResponse.product ? {
          _id: formattedResponse.product._id,
          productName: formattedResponse.product.productName,
          chemicalName: formattedResponse.product.chemicalName,
          tradeName: formattedResponse.product.tradeName,
          description: formattedResponse.product.description,
          productImages: formattedResponse.product.productImages || [],
          countryOfOrigin: formattedResponse.product.countryOfOrigin,
          color: formattedResponse.product.color,
          manufacturingMethod: formattedResponse.product.manufacturingMethod,
          specifications: {
            density: formattedResponse.product.density,
            mfi: formattedResponse.product.mfi,
            tensileStrength: formattedResponse.product.tensileStrength,
            elongationAtBreak: formattedResponse.product.elongationAtBreak,
            shoreHardness: formattedResponse.product.shoreHardness,
            waterAbsorption: formattedResponse.product.waterAbsorption
          },
          creator: formattedResponse.product.createdBy ? {
            _id: formattedResponse.product.createdBy._id,
            name: `${formattedResponse.product.createdBy.firstName} ${formattedResponse.product.createdBy.lastName}`,
            company: formattedResponse.product.createdBy.company,
            email: formattedResponse.product.createdBy.email
          } : null
        } : null,
        orderDetails: {
          quantity: formattedResponse.quantity,
          uom: formattedResponse.uom,
          destination: formattedResponse.destination,
          country: formattedResponse.country,
          deliveryDate: formattedResponse.delivery_date,
          application: formattedResponse.application,
          packagingSize: formattedResponse.packaging_size,
          expectedAnnualVolume: formattedResponse.expected_annual_volume,
          leadTime: formattedResponse.lead_time,
          terms: formattedResponse.terms,
          price: formattedResponse.price
        },
        specifications: {
          grade: formattedResponse.grade,
          incoterm: formattedResponse.incoterm,
          packagingType: formattedResponse.packagingType
        }
      } : {
        quoteType: 'Deal Quote',
        bestDeal: formattedResponse.bestDealId ? {
          _id: formattedResponse.bestDealId._id,
          title: formattedResponse.bestDealId.title,
          description: formattedResponse.bestDealId.description,
          offerPrice: formattedResponse.bestDealId.offerPrice,
          dealPrice: formattedResponse.bestDealId.dealPrice,
          originalPrice: formattedResponse.bestDealId.originalPrice,
          status: formattedResponse.bestDealId.status,
          adminNote: formattedResponse.bestDealId.adminNote,
          createdAt: formattedResponse.bestDealId.createdAt,
          product: formattedResponse.bestDealId.productId ? {
            _id: formattedResponse.bestDealId.productId._id,
            productName: formattedResponse.bestDealId.productId.productName,
            chemicalName: formattedResponse.bestDealId.productId.chemicalName,
            tradeName: formattedResponse.bestDealId.productId.tradeName,
            productImages: formattedResponse.bestDealId.productId.productImages || [],
            countryOfOrigin: formattedResponse.bestDealId.productId.countryOfOrigin,
            color: formattedResponse.bestDealId.productId.color
          } : null
        } : null,
        orderDetails: {
          desiredQuantity: formattedResponse.desiredQuantity,
          shippingCountry: formattedResponse.shippingCountry,
          paymentTerms: formattedResponse.paymentTerms,
          deliveryDeadline: formattedResponse.deliveryDeadline
        }
      }),
      
      // Unified fields for easier frontend handling
      unified: formattedResponse.unified,
      
      // Timeline and tracking
      timeline: {
        requested: formattedResponse.createdAt,
        lastUpdate: formattedResponse.updatedAt,
        deadline: formattedResponse.requestType === 'product_quote' 
          ? formattedResponse.delivery_date 
          : formattedResponse.deliveryDeadline,
        statusUpdates: formattedResponse.statusMessage?.length || 0
      },

      // Additional user-focused metadata
      metadata: {
        canEdit: formattedResponse.status === 'pending' || formattedResponse.status === 'negotiation',
        canCancel: ['pending', 'responded', 'negotiation'].includes(formattedResponse.status),
        nextActions: getNextActions(formattedResponse.status),
        estimatedProcessingTime: getEstimatedProcessingTime(formattedResponse.requestType, formattedResponse.status)
      }
    };

    res.status(200).json({
      success: true,
      message: "Quote request details retrieved successfully",
      data: responseData,
    });

  } catch (error) {
    console.error("Error fetching quote request detail:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch quote request details",
      error: {
        code: "FETCH_ERROR",
        details: error.message 
      }
    });
  }
});

export default getUserQuotes;

// Helper functions for user-focused metadata
function getNextActions(status) {
  const actionMap = {
    'pending': ['Wait for response', 'Edit request', 'Cancel request'],
    'responded': ['Review response', 'Accept offer', 'Negotiate', 'Decline'],
    'negotiation': ['Continue negotiation', 'Accept current offer', 'Cancel'],
    'accepted': ['Track progress', 'Prepare for delivery'],
    'in_progress': ['Track order status', 'Contact supplier'],
    'shipped': ['Track shipment', 'Prepare for receipt'],
    'delivered': ['Confirm receipt', 'Provide feedback'],
    'completed': ['Rate experience', 'Reorder if needed'],
    'rejected': ['Try alternative', 'Contact support'],
    'cancelled': ['Start new request', 'Contact support']
  };
  return actionMap[status] || ['Contact support'];
}

function getEstimatedProcessingTime(requestType, status) {
  const timeMap = {
    'pending': requestType === 'product_quote' ? '1-3 business days' : '1-2 business days',
    'responded': '24-48 hours for review',
    'negotiation': '2-5 business days',
    'accepted': '1-2 weeks processing',
    'in_progress': '2-4 weeks production',
    'shipped': '3-10 business days delivery',
    'delivered': 'Complete',
    'completed': 'Complete',
    'rejected': 'N/A',
    'cancelled': 'N/A'
  };
  return timeMap[status] || 'Contact support for timeline';
}
