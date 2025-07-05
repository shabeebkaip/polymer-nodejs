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
    
    // Enhanced response structure
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

      // Additional user-focused metadata (admin perspective)
      metadata: {
        canEdit: ['pending', 'responded', 'negotiation'].includes(formattedResponse.status),
        canCancel: ['pending', 'responded', 'negotiation'].includes(formattedResponse.status),
        canUpdateStatus: true, // Admin can always update status
        nextActions: getAdminNextActions(formattedResponse.status),
        estimatedProcessingTime: getEstimatedProcessingTime(formattedResponse.requestType, formattedResponse.status),
        requiresAttention: ['pending', 'negotiation'].includes(formattedResponse.status)
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
      error: error.message 
    });
  }
});

export default quoteRequestDetailRouter;

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
