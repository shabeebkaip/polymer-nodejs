// backend/routes/bestDeal/admin/listBestDeals.js
import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listBestDeals = express.Router();

listBestDeals.get(
  "/",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      const bestDeals = await BestDeal.find() // ✅ Remove status filter
        .populate("productId", "productName price productImages")
        .populate("sellerId", "firstName lastName email");

      res.status(200).json({ success: true, data: bestDeals });
    } catch (err) {
      console.error("Error fetching best deals:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default listBestDeals;
