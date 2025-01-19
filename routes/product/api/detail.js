import express from "express";
import Product from "../../../models/product.js";

const productDetail = express.Router();

productDetail.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        statusCode: 404,
      });
    }
    res.status(200).json({
      message: "Product fetched successfully",
      success: true,
      statusCode: 200,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error getting product", error);
  }
});

export default productDetail;
