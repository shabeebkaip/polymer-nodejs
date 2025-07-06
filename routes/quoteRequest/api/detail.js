import express from 'express';
import UnifiedQuoteRequest from '../../../models/unifiedQuoteRequest.js';   
import { authenticateUser } from '../../../middlewares/verify.token.js';
import QuoteRequestHelper from '../../../utils/quoteRequestHelper.js';

const quoteRequestDetailRouter = express.Router();

quoteRequestDetailRouter.get('/:id', authenticateUser, async (req, res) => {
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
    
    // Standardized response structure matching history API
    const requestObj = quoteRequest.toObject();
    
    // Standardized base structure for both types (same as history API)
    const responseData = {
      _id: requestObj._id,
      requestType: requestObj.requestType,
      status: requestObj.status,
      message: requestObj.message,
      createdAt: requestObj.createdAt,
      updatedAt: requestObj.updatedAt,
      statusMessage: requestObj.statusMessage || [],
      
      // Standardized fields that work for both types
      productName: null,
      productId: null,
      company: null,
      companyId: null,
      quantity: null,
      unit: null,
      destination: null,
      deliveryDate: null,
      grade: null,
      
      // Buyer information (consistent for both)
      buyer: requestObj.buyerId ? {
        _id: requestObj.buyerId._id,
        firstName: requestObj.buyerId.firstName,
        lastName: requestObj.buyerId.lastName,
        name: `${requestObj.buyerId.firstName} ${requestObj.buyerId.lastName}`,
        company: requestObj.buyerId.company,
        email: requestObj.buyerId.email,
        phone: requestObj.buyerId.phone,
        address: {
          full: requestObj.buyerId.address,
          city: requestObj.buyerId.city,
          state: requestObj.buyerId.state,
          country: requestObj.buyerId.country,
          pincode: requestObj.buyerId.pincode
        },
        userType: requestObj.buyerId.userType
      } : null,
      
      // Unified fields (consistent for both)
      unified: {
        statusIcon: getStatusIcon(requestObj.status),
        priorityLevel: null
      }
    };

    // Type-specific data mapping to standardized fields
    if (requestObj.requestType === 'product_quote') {
      responseData.quoteType = 'Product Quote';
      responseData.productName = requestObj.product?.productName || 'N/A';
      responseData.productId = requestObj.product?._id || null;
      responseData.company = requestObj.product?.createdBy?.company || 'N/A';
      responseData.companyId = requestObj.product?.createdBy?._id || null;
      responseData.quantity = requestObj.quantity || 'N/A';
      responseData.unit = requestObj.uom || 'N/A';
      responseData.destination = requestObj.destination || requestObj.country || 'N/A';
      responseData.deliveryDate = requestObj.delivery_date;
      responseData.grade = requestObj.grade?.name || 'N/A';
      
      // Additional product-specific details
      responseData.productQuote = {
        product: {
          _id: requestObj.product?._id,
          productName: requestObj.product?.productName,
          chemicalName: requestObj.product?.chemicalName,
          tradeName: requestObj.product?.tradeName,
          description: requestObj.product?.description,
          productImages: requestObj.product?.productImages || [],
          countryOfOrigin: requestObj.product?.countryOfOrigin,
          color: requestObj.product?.color,
          manufacturingMethod: requestObj.product?.manufacturingMethod,
          specifications: {
            density: requestObj.product?.density,
            mfi: requestObj.product?.mfi,
            tensileStrength: requestObj.product?.tensileStrength,
            elongationAtBreak: requestObj.product?.elongationAtBreak,
            shoreHardness: requestObj.product?.shoreHardness,
            waterAbsorption: requestObj.product?.waterAbsorption
          },
          creator: requestObj.product?.createdBy ? {
            _id: requestObj.product.createdBy._id,
            name: `${requestObj.product.createdBy.firstName} ${requestObj.product.createdBy.lastName}`,
            company: requestObj.product.createdBy.company,
            email: requestObj.product.createdBy.email,
            phone: requestObj.product.createdBy.phone,
            address: {
              full: requestObj.product.createdBy.address,
              city: requestObj.product.createdBy.city,
              state: requestObj.product.createdBy.state,
              country: requestObj.product.createdBy.country
            }
          } : null
        },
        application: requestObj.application,
        terms: requestObj.terms,
        packaging_size: requestObj.packaging_size,
        expected_annual_volume: requestObj.expected_annual_volume,
        lead_time: requestObj.lead_time,
        incoterm: requestObj.incoterm,
        packagingType: requestObj.packagingType,
        price: requestObj.price
      };
      
      responseData.unified.quantity = requestObj.quantity;
      responseData.unified.deliveryDate = requestObj.delivery_date;
      responseData.unified.location = requestObj.country;
      responseData.unified.productInfo = requestObj.product?.productName || 'Product Quote';
      responseData.unified.type = 'product_quote';
      responseData.unified.title = requestObj.product?.productName || 'Product Quote';
      responseData.unified.priorityLevel = getPriorityLevel(requestObj.delivery_date);
      
    } else {
      // deal_quote
      responseData.quoteType = 'Deal Quote';
      responseData.productName = requestObj.bestDealId?.productId?.productName || 'N/A';
      responseData.productId = requestObj.bestDealId?.productId?._id || null;
      responseData.company = 'N/A'; // Deal quotes don't have a direct company
      responseData.companyId = null;
      responseData.quantity = requestObj.desiredQuantity || 'N/A';
      responseData.unit = 'N/A'; // Deal quotes don't specify unit
      responseData.destination = requestObj.shippingCountry || 'N/A';
      responseData.deliveryDate = requestObj.deliveryDeadline;
      responseData.grade = 'N/A'; // Deal quotes don't have grade
      
      // Additional deal-specific details
      responseData.dealQuote = {
        bestDeal: {
          _id: requestObj.bestDealId?._id,
          title: requestObj.bestDealId?.title,
          description: requestObj.bestDealId?.description,
          offerPrice: requestObj.bestDealId?.offerPrice,
          dealPrice: requestObj.bestDealId?.dealPrice,
          originalPrice: requestObj.bestDealId?.originalPrice,
          status: requestObj.bestDealId?.status,
          adminNote: requestObj.bestDealId?.adminNote,
          createdAt: requestObj.bestDealId?.createdAt,
          product: requestObj.bestDealId?.productId ? {
            _id: requestObj.bestDealId.productId._id,
            productName: requestObj.bestDealId.productId.productName,
            chemicalName: requestObj.bestDealId.productId.chemicalName,
            tradeName: requestObj.bestDealId.productId.tradeName,
            productImages: requestObj.bestDealId.productId.productImages || [],
            countryOfOrigin: requestObj.bestDealId.productId.countryOfOrigin,
            color: requestObj.bestDealId.productId.color
          } : null
        },
        paymentTerms: requestObj.paymentTerms,
        offerPrice: requestObj.bestDealId?.offerPrice
      };
      
      responseData.unified.quantity = requestObj.desiredQuantity;
      responseData.unified.deliveryDate = requestObj.deliveryDeadline;
      responseData.unified.location = requestObj.shippingCountry;
      responseData.unified.productInfo = requestObj.bestDealId?.productId?.productName || 'Deal Quote';
      responseData.unified.type = 'deal_quote';
      responseData.unified.title = requestObj.bestDealId?.productId?.productName || 'Deal Quote';
      responseData.unified.priorityLevel = getPriorityLevel(requestObj.deliveryDeadline);
    }

    // Timeline and tracking
    responseData.timeline = {
      requested: requestObj.createdAt,
      lastUpdate: requestObj.updatedAt,
      deadline: requestObj.requestType === 'product_quote' 
        ? requestObj.delivery_date 
        : requestObj.deliveryDeadline,
      statusUpdates: requestObj.statusMessage?.length || 0
    };

    // Additional user-focused metadata (admin perspective)
    responseData.metadata = {
      canEdit: ['pending', 'responded', 'negotiation'].includes(requestObj.status),
      canCancel: ['pending', 'responded', 'negotiation'].includes(requestObj.status),
      canUpdateStatus: true, // Admin can always update status
      nextActions: getAdminNextActions(requestObj.status),
      estimatedProcessingTime: getEstimatedProcessingTime(requestObj.requestType, requestObj.status),
      requiresAttention: ['pending', 'negotiation'].includes(requestObj.status)
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
      error: error.message 
    });
  }
});

export default quoteRequestDetailRouter;

// Helper functions for status and priority (same as history API)
function getStatusIcon(status) {
  const statusIconMap = {
    'pending': '⏳',
    'responded': '💬',
    'negotiation': '🤝',
    'accepted': '✅',
    'in_progress': '⚙️',
    'shipped': '🚚',
    'delivered': '📦',
    'completed': '🎉',
    'rejected': '❌',
    'cancelled': '🚫'
  };
  return statusIconMap[status] || '❓';
}

function getPriorityLevel(deliveryDate) {
  if (!deliveryDate) return 'normal';
  
  const now = new Date();
  const delivery = new Date(deliveryDate);
  const daysDiff = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'urgent'; // Past due
  if (daysDiff <= 7) return 'urgent';
  if (daysDiff <= 14) return 'high';
  if (daysDiff <= 30) return 'medium';
  return 'normal';
}

// Helper functions for admin-focused metadata
function getAdminNextActions(status) {
  const actionMap = {
    'pending': ['Review request', 'Respond to quote', 'Request more info'],
    'responded': ['Follow up', 'Update pricing', 'Set negotiation'],
    'negotiation': ['Continue negotiation', 'Finalize terms', 'Escalate'],
    'accepted': ['Process order', 'Arrange production', 'Update timeline'],
    'in_progress': ['Monitor progress', 'Update customer', 'Prepare shipping'],
    'shipped': ['Track shipment', 'Confirm delivery', 'Follow up'],
    'delivered': ['Confirm receipt', 'Process payment', 'Get feedback'],
    'completed': ['Archive', 'Generate report', 'Follow up for reorder'],
    'rejected': ['Archive', 'Analyze reason', 'Improve process'],
    'cancelled': ['Archive', 'Analyze reason', 'Follow up']
  };
  return actionMap[status] || ['Review status', 'Contact customer'];
}

function getEstimatedProcessingTime(requestType, status) {
  const timeMap = {
    'pending': requestType === 'product_quote' ? '1-3 business days' : '1-2 business days',
    'responded': '24-48 hours for customer review',
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
