import express from "express";
import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createDealQuoteRequest = express.Router();

createDealQuoteRequest.post("/", authenticateUser, async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      bestDealId,
      desiredQuantity,
      shippingCountry,
      paymentTerms,
      deliveryDeadline,
      message,
    } = req.body;

    const newRequest = new DealQuoteRequest({
      buyerId,
      bestDealId,
      desiredQuantity,
      shippingCountry,
      paymentTerms,
      deliveryDeadline,
      message,
      status: "pending", 
    });

    const saved = await newRequest.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Quote request creation error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

export default createDealQuoteRequest;
