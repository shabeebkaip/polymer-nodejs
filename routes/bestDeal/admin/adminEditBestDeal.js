// adminEditBestDeal.js - Backend Edit API
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
      const {
        productId,
        sellerId,
        offerPrice,
        adminNote,
        status
      } = req.body;

      // Log to debug
      console.log("Editing Best Deal ID:", id);
      console.log("Body:", req.body);

      if (!productId || !sellerId || !offerPrice) {
        return res
          .status(400)
          .json({ success: false, error: "Product, Seller, and Offer Price are required." });
      }

      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid product selected." });
      }

      // Validate seller exists
      const seller = await User.findById(sellerId);
      if (!seller) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid seller selected." });
      }

      const updatedDeal = await BestDeal.findByIdAndUpdate(
        id,
        {
          productId,
          sellerId,
          offerPrice: Number(offerPrice),
          adminNote,
          status: status || "pending"
        },
        { new: true, runValidators: true }
      );

      if (!updatedDeal) {
        return res
          .status(404)
          .json({ success: false, error: "Best deal not found." });
      }

      res.status(200).json({
        success: true,
        message: "Best deal updated successfully",
        data: updatedDeal,
      });
    } catch (err) {
      console.error("Best Deal Update Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default adminEditBestDeal;