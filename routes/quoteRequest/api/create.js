import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";
import Notification from '../../../models/notification.js';
import UnifiedQuoteRequest from '../../../models/unifiedQuoteRequest.js'

const createQuote = express.Router();

createQuote.post("/", authenticateUser, async (req, res) => {
  try {
    const { requestType, ...requestData } = req.body;
    
    // Validate request type
    if (!requestType || !['product_quote', 'deal_quote'].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing request type. Must be 'product_quote' or 'deal_quote'",
        error: {
          code: "INVALID_REQUEST_TYPE",
          details: "Request type is required and must be either 'product_quote' or 'deal_quote'"
        }
      });
    }

    let unifiedData;
    
    // Create appropriate quote structure based on type
    if (requestType === 'product_quote') {
      unifiedData = QuoteRequestHelper.createProductQuote({
        ...requestData,
        buyerId: req.user.id, // Use unified field only
        // Map pricing field if it exists
        price: requestData.pricing || requestData.price
      });
    } else if (requestType === 'deal_quote') {
      unifiedData = QuoteRequestHelper.createDealQuote({
        ...requestData,
        buyerId: req.user.id
      });
    }

    // Create and save the unified quote request
    const quoteRequest = new UnifiedQuoteRequest(unifiedData);
    const savedRequest = await quoteRequest.save();

    // Populate references for response
    await savedRequest.populate([
      { 
        path: 'product', 
        select: 'productName chemicalName tradeName productImages price',
        populate: {
          path: 'createdBy',
          select: 'firstName lastName company email'
        }
      },
      { 
        path: 'bestDealId', 
        select: 'offerPrice status',
        populate: {
          path: 'productId',
          select: 'productName chemicalName'
        }
      },
      { path: 'buyerId', select: 'firstName lastName company email' }, // Only use buyerId, not user
      { path: 'grade', select: 'name' },
      { path: 'incoterm', select: 'name' },
      { path: 'packagingType', select: 'name' }
    ]);

    // Format response using helper
    const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(savedRequest);
    
    res.status(201).json({
      success: true,
      message: `${requestType === 'product_quote' ? 'Product' : 'Deal'} quote request created successfully`,
      data: {
        id: formattedResponse.id,
        requestType: formattedResponse.requestType,
        status: formattedResponse.status,
        message: formattedResponse.message,
        createdAt: formattedResponse.createdAt,
        updatedAt: formattedResponse.updatedAt,
        
        // Type-specific data
        ...(requestType === 'product_quote' ? {
          product: formattedResponse.product,
          buyer: formattedResponse.buyerId, // Use buyerId instead of user
          quantity: formattedResponse.quantity,
          uom: formattedResponse.uom,
          destination: formattedResponse.destination,
          country: formattedResponse.country,
          delivery_date: formattedResponse.delivery_date,
          application: formattedResponse.application,
          packaging_size: formattedResponse.packaging_size,
          expected_annual_volume: formattedResponse.expected_annual_volume,
          grade: formattedResponse.grade,
          incoterm: formattedResponse.incoterm,
          packagingType: formattedResponse.packagingType
        } : {
          bestDeal: formattedResponse.bestDealId,
          buyer: formattedResponse.buyerId,
          desiredQuantity: formattedResponse.desiredQuantity,
          shippingCountry: formattedResponse.shippingCountry,
          paymentTerms: formattedResponse.paymentTerms,
          deliveryDeadline: formattedResponse.deliveryDeadline
        }),
        
        // Unified fields for easier frontend handling
        unified: formattedResponse.unified
      }
    });
    
    // After saving and populating the quote request
    function notifySupplier({ supplierId, productName, quoteId, buyer }) {
      return Notification.create({
        userId: supplierId,
        type: 'quote-enquiry',
        message: `New quote request for your product: ${productName?.en || productName}`,
        redirectUrl: `/user/quote-enquiries/${quoteId}`,
        relatedId: quoteId,
        meta: {
          buyerId: buyer?._id,
          buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : ''
        }
      });
    }
    if (requestType === 'product_quote' && formattedResponse.product && formattedResponse.product.createdBy) {
      await notifySupplier({
        supplierId: formattedResponse.product.createdBy._id,
        productName: formattedResponse.product.productName,
        quoteId: formattedResponse.id,
        buyer: formattedResponse.buyerId
      });
    }
    if (requestType === 'deal_quote' && formattedResponse.bestDeal && formattedResponse.bestDeal.productId && formattedResponse.bestDeal.productId.createdBy) {
      await notifySupplier({
        supplierId: formattedResponse.bestDeal.productId.createdBy._id,
        productName: formattedResponse.bestDeal.productId.productName,
        quoteId: formattedResponse.id,
        buyer: formattedResponse.buyerId
      });
    }
    
  } catch (err) {
    console.error("Error saving unified quote request:", err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
        error: {
          code: "VALIDATION_ERROR",
          details: err.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create quote request",
      error: {
        code: "CREATE_ERROR",
        details: err.message
      }
    });
  }
});

export default createQuote;
