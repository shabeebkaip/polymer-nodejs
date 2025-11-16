import express from "express";
import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listAllDealQuotes = express.Router();

listAllDealQuotes.get("/list", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query to only include future deadlines
    const query = {
      $or: [
        { deliveryDeadline: { $gte: new Date() } }, // Future deadlines
        { deliveryDeadline: { $exists: false } }, // Or no deadline set
        { deliveryDeadline: null } // Or null deadline
      ]
    };

    const totalQuotes = await DealQuoteRequest.countDocuments(query);

    const quotes = await DealQuoteRequest.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("buyerId", "firstName lastName email")
      .populate({
        path: "bestDealId",
        populate: [
          {
            path: "productId",
            select: "productName"
          },
          {
            path: "sellerId",
            select: "firstName lastName email"
          }
        ]
      });

    const formattedQuotes = quotes.map((quote) => {
      const obj = quote.toObject();

      if (obj.buyerId) {
        obj.buyerId.name = `${obj.buyerId.firstName} ${obj.buyerId.lastName}`;
        delete obj.buyerId.firstName;
        delete obj.buyerId.lastName;
      }

      if (obj.bestDealId?.sellerId) {
        obj.bestDealId.sellerId.name = `${obj.bestDealId.sellerId.firstName} ${obj.bestDealId.sellerId.lastName}`;
        delete obj.bestDealId.sellerId.firstName;
        delete obj.bestDealId.sellerId.lastName;
      }

      return obj;
    });

    res.status(200).json({
      success: true,
      data: formattedQuotes,
      total: totalQuotes,
      page,
      totalPages: Math.ceil(totalQuotes / limit),
    });
  } catch (err) {
    console.error("Admin quote list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default listAllDealQuotes;
