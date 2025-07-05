import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";

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
        user: req.user.id, // For backward compatibility
        buyerId: req.user.id // Unified field
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
      { path: 'user', select: 'firstName lastName company email' },
      { path: 'buyerId', select: 'firstName lastName company email' },
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
          user: formattedResponse.user,
          quantity: formattedResponse.quantity,
          uom: formattedResponse.uom,
          destination: formattedResponse.destination,
          country: formattedResponse.country,
          delivery_date: formattedResponse.delivery_date,
          application: formattedResponse.application
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
