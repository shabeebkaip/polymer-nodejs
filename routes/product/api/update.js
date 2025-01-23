import express from "express";
import Product from "../../../models/product.js";

const productUpdate = express.Router();

productUpdate.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        statusCode: 404,
      });
    }
    res.status(200).json({
      message: "Product updated successfully",
      success: true,
      status: 200,
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
      statusCode: 500,
    });
    console.log("Error updating product", error);
  }
});

export default productUpdate;
