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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalDeals = await BestDeal.countDocuments();

      const bestDeals = await BestDeal.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("productId", "productName price productImages")
        .populate("sellerId", "firstName lastName email");

      const formatted = bestDeals.map((deal) => {
        const obj = deal.toObject();
        if (obj.sellerId) {
          obj.sellerId.name = `${obj.sellerId.firstName} ${obj.sellerId.lastName}`;
          delete obj.sellerId.firstName;
          delete obj.sellerId.lastName;
        }
        return obj;
      });

      res.status(200).json({
        success: true,
        data: formatted,
        total: totalDeals,
        page,
        totalPages: Math.ceil(totalDeals / limit),
      });
    } catch (err) {
      console.error("Error fetching best deals:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default listBestDeals;
