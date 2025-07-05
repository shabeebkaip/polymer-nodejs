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

    // Find quote request - check both user fields for unified model
    const quoteRequest = await UnifiedQuoteRequest.findOne({ 
      _id: id,
      $or: [
        { user: userId },     // For product quotes (legacy field)
        { buyerId: userId }   // For deal quotes (unified field)
      ]
    })
      .populate({
        path: "user",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone company address city state country pincode userType",
      })
      .populate({
        path: "product",
        select: "productName chemicalName description tradeName productImages density mfi tensileStrength elongationAtBreak shoreHardness waterAbsorption countryOfOrigin color manufacturingMethod createdBy category subCategory",
        populate: [
          {
            path: "createdBy",
            select: "firstName lastName email phone company address city state country",
          },
          {
            path: "category",
            select: "name description",
          },
          {
            path: "subCategory",
            select: "name description",
          }
        ]
      })
      .populate({
        path: "bestDealId",
        select: "offerPrice status adminNote createdAt dealPrice originalPrice title description",
        populate: {
          path: "productId",
          select: "productName chemicalName tradeName productImages countryOfOrigin color category subCategory",
          populate: [
            {
              path: "category",
              select: "name description",
            },
            {
              path: "subCategory", 
              select: "name description",
            }
          ]
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
      id: formattedResponse.id,
      requestType: formattedResponse.requestType,
      status: formattedResponse.status,
      message: formattedResponse.message,
      createdAt: formattedResponse.createdAt,
      updatedAt: formattedResponse.updatedAt,
      statusHistory: formattedResponse.statusMessage || [],
      
      // User information (buyer/requester)
      requester: formattedResponse.user || formattedResponse.buyerId ? {
        id: (formattedResponse.user || formattedResponse.buyerId)?._id,
        name: `${(formattedResponse.user || formattedResponse.buyerId)?.firstName} ${(formattedResponse.user || formattedResponse.buyerId)?.lastName}`,
        email: (formattedResponse.user || formattedResponse.buyerId)?.email,
        phone: (formattedResponse.user || formattedResponse.buyerId)?.phone,
        company: (formattedResponse.user || formattedResponse.buyerId)?.company,
        address: {
          full: (formattedResponse.user || formattedResponse.buyerId)?.address,
          city: (formattedResponse.user || formattedResponse.buyerId)?.city,
          state: (formattedResponse.user || formattedResponse.buyerId)?.state,
          country: (formattedResponse.user || formattedResponse.buyerId)?.country,
          pincode: (formattedResponse.user || formattedResponse.buyerId)?.pincode
        },
        userType: (formattedResponse.user || formattedResponse.buyerId)?.userType
      } : null,
      
      // Type-specific data
      ...(formattedResponse.requestType === 'product_quote' ? {
        quoteType: 'Product Quote',
        product: formattedResponse.product ? {
          id: formattedResponse.product._id,
          productName: formattedResponse.product.productName,
          chemicalName: formattedResponse.product.chemicalName,
          tradeName: formattedResponse.product.tradeName,
          description: formattedResponse.product.description,
          productImages: formattedResponse.product.productImages || [],
          countryOfOrigin: formattedResponse.product.countryOfOrigin,
          color: formattedResponse.product.color,
          manufacturingMethod: formattedResponse.product.manufacturingMethod,
          category: formattedResponse.product.category ? {
            id: formattedResponse.product.category._id,
            name: formattedResponse.product.category.name,
            description: formattedResponse.product.category.description
          } : null,
          subCategory: formattedResponse.product.subCategory ? {
            id: formattedResponse.product.subCategory._id,
            name: formattedResponse.product.subCategory.name,
            description: formattedResponse.product.subCategory.description
          } : null,
          specifications: {
            density: formattedResponse.product.density,
            mfi: formattedResponse.product.mfi,
            tensileStrength: formattedResponse.product.tensileStrength,
            elongationAtBreak: formattedResponse.product.elongationAtBreak,
            shoreHardness: formattedResponse.product.shoreHardness,
            waterAbsorption: formattedResponse.product.waterAbsorption
          },
          creator: formattedResponse.product.createdBy ? {
            id: formattedResponse.product.createdBy._id,
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
          id: formattedResponse.bestDealId._id,
          title: formattedResponse.bestDealId.title,
          description: formattedResponse.bestDealId.description,
          offerPrice: formattedResponse.bestDealId.offerPrice,
          dealPrice: formattedResponse.bestDealId.dealPrice,
          originalPrice: formattedResponse.bestDealId.originalPrice,
          status: formattedResponse.bestDealId.status,
          adminNote: formattedResponse.bestDealId.adminNote,
          createdAt: formattedResponse.bestDealId.createdAt,
          product: formattedResponse.bestDealId.productId ? {
            id: formattedResponse.bestDealId.productId._id,
            productName: formattedResponse.bestDealId.productId.productName,
            chemicalName: formattedResponse.bestDealId.productId.chemicalName,
            tradeName: formattedResponse.bestDealId.productId.tradeName,
            productImages: formattedResponse.bestDealId.productId.productImages || [],
            countryOfOrigin: formattedResponse.bestDealId.productId.countryOfOrigin,
            color: formattedResponse.bestDealId.productId.color,
            category: formattedResponse.bestDealId.productId.category ? {
              id: formattedResponse.bestDealId.productId.category._id,
              name: formattedResponse.bestDealId.productId.category.name,
              description: formattedResponse.bestDealId.productId.category.description
            } : null,
            subCategory: formattedResponse.bestDealId.productId.subCategory ? {
              id: formattedResponse.bestDealId.productId.subCategory._id,
              name: formattedResponse.bestDealId.productId.subCategory.name,
              description: formattedResponse.bestDealId.productId.subCategory.description
            } : null
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
