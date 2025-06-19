import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminCreateBestDeal = express.Router();

adminCreateBestDeal.post("/", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const newDeal = new BestDeal(req.body); // admin must pass sellerId and productId
    const savedDeal = await newDeal.save();

    res.status(201).json({ message: "Best deal created by admin", bestDeal: savedDeal });
  } catch (err) {
    console.error("Admin create deal error:", err);
    res.status(400).json({ error: err.message });
  }
});

export default adminCreateBestDeal;
