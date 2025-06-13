import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../middlewares/verify.token.js";

const listPendingDeals = express.Router();

listPendingDeals.get(
  "/",
  authenticateUser,
  authorizeRoles("superAdmin"), // 👈 This ensures only superAdmin can access
  async (req, res) => {
    try {
      const pendingDeals = await BestDeal.find({ status: "pending" })
        .populate("productId", "productName price productImages")
        .populate("sellerId", "name email");

      res.status(200).json(pendingDeals);
    } catch (err) {
      console.error("Error fetching pending best deals:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default listPendingDeals;
