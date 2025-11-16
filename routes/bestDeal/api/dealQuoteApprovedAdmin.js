import express from "express";
import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const listApprovedQuotes = express.Router();

listApprovedQuotes.get("/", authenticateUser, async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Build query to only include approved quotes with future deadlines
    const query = {
      status: "approved",
      $or: [
        { deliveryDeadline: { $gte: new Date() } }, // Future deadlines
        { deliveryDeadline: { $exists: false } }, // Or no deadline set
        { deliveryDeadline: null } // Or null deadline
      ]
    };

    const approvedQuotes = await DealQuoteRequest.find(query)
      .populate({
        path: "bestDealId",
        match: { sellerId: sellerId },
        populate: { path: "productId", select: "productName productImages" },
      })
      .populate("buyerId", "firstName lastName email");

    const filtered = approvedQuotes.filter((quote) => quote.bestDealId !== null);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    console.error("Error listing approved quotes:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default listApprovedQuotes;
