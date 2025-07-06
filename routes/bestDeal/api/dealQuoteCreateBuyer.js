import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createDealQuoteRequest = express.Router();

createDealQuoteRequest.post("/", authenticateUser, async (req, res) => {
  try {
    console.log("🔶 DEAL QUOTE CREATE via /api/best-deal/buyer-deal-quote - User:", req.user.id);
    
    const buyerId = req.user.id;
    const {
      bestDealId,
      desiredQuantity,
      shippingCountry,
      paymentTerms,
      deliveryDeadline,
      message,
    } = req.body;

    // Create unified deal quote using helper
    const unifiedData = QuoteRequestHelper.createDealQuote({
      buyerId,
      bestDealId,
      desiredQuantity,
      shippingCountry,
      paymentTerms,
      deliveryDeadline,
      message,
      status: "pending"
    });

    const newRequest = new UnifiedQuoteRequest(unifiedData);
    const saved = await newRequest.save();
    
    // Populate for response
    await saved.populate([
      { path: 'buyerId', select: 'firstName lastName email company' },
      { path: 'bestDealId', select: 'title description dealPrice' }
    ]);
    
    const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(saved);
    
    res.status(201).json({ 
      success: true, 
      message: "Deal quote request created successfully",
      data: formattedResponse 
    });
  } catch (err) {
    console.error("Deal quote request creation error:", err);
    res.status(400).json({ 
      success: false, 
      message: "Failed to create deal quote request",
      error: {
        code: "CREATE_ERROR",
        details: err.message
      }
    });
  }
});

export default createDealQuoteRequest;
