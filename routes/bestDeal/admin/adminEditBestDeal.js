import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import Product from "../../../models/product.js";
import User from "../../../models/user.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminEditBestDeal = express.Router();

adminEditBestDeal.put(
  "/:id",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { productId, offerPrice, adminNote, status } = req.body;

      // Get original deal
      const originalDeal = await BestDeal.findById(id);
      if (!originalDeal) {
        return res.status(404).json({ success: false, error: "Best deal not found." });
      }

      // Fetch deal creator
      const seller = await User.findById(originalDeal.sellerId);
      if (!seller) {
        return res.status(400).json({ success: false, error: "Invalid seller found." });
      }

      //  Prevent editing if seller is not superAdmin (i.e., a seller)
      if (seller.user_type !== "superAdmin") {
        return res.status(403).json({
          success: false,
          error: "Admin created best deals only can be edited.",
        });
      }

      // Validate required fields
      if (!productId || !offerPrice) {
        return res.status(400).json({ success: false, error: "Product and Offer Price are required." });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({ success: false, error: "Invalid product selected." });
      }

      const updatedDeal = await BestDeal.findByIdAndUpdate(
        id,
        {
          productId,
          offerPrice: Number(offerPrice),
          adminNote,
          status: status || "pending"
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Best deal updated successfully",
        data: updatedDeal,
      });
    } catch (err) {
      console.error("Best Deal Update Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default adminEditBestDeal;