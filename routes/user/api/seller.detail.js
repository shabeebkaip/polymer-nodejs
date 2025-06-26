import express from "express";
import mongoose from "mongoose";
import User from "../../../models/user.js";
import Product from "../../../models/product.js";
import { productAggregation } from "../../product/aggregation/product.aggregation.js";

const sellerDetail = express.Router();

sellerDetail.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid seller ID" });
  }

  try {
    const seller = await User.findOne({
      _id: id,
      user_type: "seller",
      verification: "approved",
    });

    if (!seller) {
      return res
        .status(404)
        .json({ message: "Seller not found or not approved" });
    }

    // Get products created by the seller
    const products = await Product.find({ createdBy: seller._id }).select(
      "_id"
    );
    const productIds = products.map((p) => p._id);

    let enrichedProducts = [];

    if (productIds.length > 0) {
      enrichedProducts = await Product.aggregate([
        { $match: { _id: { $in: productIds } } },
        ...productAggregation(),
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        ...seller.toObject(),
        products: enrichedProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching seller detail:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching seller detail" });
  }
});

export default sellerDetail;
