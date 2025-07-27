import express from "express";
import UnifiedQuoteRequest from "../../../models/unifiedQuoteRequest.js";
import QuoteRequestHelper from "../../../utils/quoteRequestHelper.js";
import Notification from "../../../models/notification.js";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createDealQuoteRequest = express.Router();

createDealQuoteRequest.post("/", authenticateUser, async (req, res) => {
  try {
    console.log(
      "🔶 DEAL QUOTE CREATE via /api/best-deal/buyer-deal-quote - User:",
      req.user.id
    );

    const buyerId = req.user.id;
    const {
      bestDealId,
      desiredQuantity,
      shippingCountry,
      paymentTerms,
      deliveryDeadline,
      message,
    } = req.body;

    // Fetch sellerId from product.createdBy via BestDeal
    let sellerId;
    let bestDeal;
    try {
      bestDeal = await BestDeal.findById(bestDealId)
        .populate({ path: 'productId', select: 'createdBy', populate: { path: 'createdBy', select: '_id' } })
        .select('productId');
    } catch (err) {
      console.error('Failed to fetch sellerId from product.createdBy:', err);
    }
    // If bestDeal, productId, or sellerId is missing, return error
    if (!bestDeal || !bestDeal.productId || !bestDeal.productId.createdBy || !bestDeal.productId.createdBy._id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bestDealId or missing product owner (sellerId)',
        error: {
          code: 'MISSING_SELLER_ID',
          details: 'Could not find sellerId (product owner) for the provided bestDealId.'
        }
      });
    }
    sellerId = bestDeal.productId.createdBy._id;
    console.log("Seller ID from product createdBy:", sellerId);

    // Create unified deal quote using helper
    const unifiedData = QuoteRequestHelper.createDealQuote({
      buyerId,
      bestDealId,
      sellerId, // <-- set sellerId here
      desiredQuantity,
      shippingCountry,
      paymentTerms,
      deliveryDeadline,
      message,
      status: "pending",
    });

    const newRequest = new UnifiedQuoteRequest(unifiedData);
    const saved = await newRequest.save();

    // Populate for response
    await saved.populate([
      { path: "buyerId", select: "firstName lastName email company" },
      {
        path: "bestDealId",
        select: "title description dealPrice createdBy productId",
        populate: [
          { path: "createdBy", select: "firstName lastName email company" },
          { path: "productId", select: "productName" },
        ],
      },
    ]);

    const formattedResponse = QuoteRequestHelper.formatUnifiedResponse(saved);
    console.log("🔶 DEAL QUOTE CREATE - Response:", formattedResponse);
    // Fetch product detail for notification
    let productName = "";
    if (
      formattedResponse.bestDealId &&
      formattedResponse.bestDealId.productId &&
      formattedResponse.bestDealId.productId.productName
    ) {
      productName =
        formattedResponse.bestDealId.productId.productName?.en ||
        formattedResponse.bestDealId.productId.productName;
    }
    // Notify the user who created the deal
    if (
      formattedResponse.bestDealId &&
      formattedResponse.bestDealId.createdBy &&
      formattedResponse.bestDealId.createdBy._id
    ) {
      try {
        await Notification.create({
          userId: formattedResponse.bestDealId.createdBy._id,
          type: "quote-enquiry",
          message: `New deal quote request for your deal: ${productName}`,
          redirectUrl: `/user/quote-enquiries/${formattedResponse._id}`,
          relatedId: formattedResponse._id,
          meta: {
            buyerId,
            dealId: bestDealId,
          },
        });
      } catch (notifyErr) {
        console.error("Failed to notify deal creator:", notifyErr);
      }
    }

    res.status(201).json({
      success: true,
      message: "Deal quote request created successfully",
      data: formattedResponse,
    });
  } catch (err) {
    console.error("Deal quote request creation error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to create deal quote request",
      error: {
        code: "CREATE_ERROR",
        details: err.message,
      },
    });
  }
});

export default createDealQuoteRequest;
