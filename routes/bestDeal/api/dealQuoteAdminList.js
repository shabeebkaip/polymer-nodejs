import express from "express";
import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listAllDealQuotes = express.Router();

listAllDealQuotes.get("/list", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const quotes = await DealQuoteRequest.find()
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
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: quotes });
  } catch (err) {
    console.error("Admin quote list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default listAllDealQuotes;
