import express from "express";
import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listDealQuotesForSeller = express.Router();

listDealQuotesForSeller.get("/seller/list", authenticateUser, authorizeRoles("seller"), async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Build query to only include deal quotes with future deadlines
    const query = {
      $or: [
        { deliveryDeadline: { $gte: new Date() } }, // Future deadlines
        { deliveryDeadline: { $exists: false } }, // Or no deadline set
        { deliveryDeadline: null } // Or null deadline
      ]
    };

    const quotes = await DealQuoteRequest.find(query)
      .populate({
        path: "bestDealId",
        match: { sellerId },  // ✅ Filter by seller
        populate: {
          path: "productId",
          select: "productName"
        }
      })
      .populate("buyerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    // ⚠️ Filter out quotes where bestDealId was not matched
    const filteredQuotes = quotes.filter(q => q.bestDealId !== null);

    res.status(200).json({ success: true, data: filteredQuotes });
  } catch (err) {
    console.error("Seller quote list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default listDealQuotesForSeller;
