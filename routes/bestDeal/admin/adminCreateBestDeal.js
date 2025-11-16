// adminCreateBestDeal.js - Updated Backend API
import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import Product from "../../../models/product.js";
import User from "../../../models/user.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminCreateBestDeal = express.Router();

adminCreateBestDeal.post(
  "/",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      const {
        productId,
        sellerId,
        offerPrice,
        validity,
        adminNote
      } = req.body;

      // Log to debug
      console.log("User:", req.user);
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

      const bestDeal = new BestDeal({
        productId,
        sellerId,
        offerPrice: Number(offerPrice),
        validity: validity ? new Date(validity) : null,
        adminNote,
        status: "pending",
        createdBy: sellerId
      });

      const saved = await bestDeal.save();

      res.status(201).json({
        success: true,
        message: "Best deal created successfully",
        data: saved,
      });
    } catch (err) {
      console.error("Best Deal Creation Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default adminCreateBestDeal;