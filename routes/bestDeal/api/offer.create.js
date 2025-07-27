import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createBestDeal = express.Router();

createBestDeal.post("/", authenticateUser, async (req, res) => {
  try {
    const { productId, offerPrice } = req.body;
    const sellerId = req.user.id; // same as createSample

    // Check for existing best deal
    const dealExists = await BestDeal.findOne({ productId, sellerId });
    if (dealExists) {
      return res.status(400).json({ message: "Best deal already exists for this product" });
    }

    const bestDeal = new BestDeal({
      productId,
      offerPrice,
      sellerId,
      createdBy: sellerId, // Track who created the deal
      status: "pending", // default value, can be skipped if already set in schema
    });

    const savedDeal = await bestDeal.save();
    res.status(201).json(savedDeal);
  } catch (err) {
    console.error("Error creating best deal:", err);
    res.status(400).json({ error: err.message });
  }
});

export default createBestDeal;
