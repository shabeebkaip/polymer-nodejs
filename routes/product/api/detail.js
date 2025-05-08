import express from "express";
import Product from "../../../models/product.js";
import mongoose from 'mongoose';
import { productAggregation } from "../aggregation/product.aggregation.js";

const productDetail = express.Router();

productDetail.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const pipeline = productAggregation();

    pipeline.unshift({
      $match: { _id: new mongoose.Types.ObjectId(id) }
    });

    const products = await Product.aggregate(pipeline);

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: products[0] });

  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default productDetail;
