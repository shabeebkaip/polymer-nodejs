import express from "express";
import Product from "../../../models/product.js";

const productDelete = express.Router();

productDelete.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        statusCode: 404,
      });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      status: true,
      statusCode: 200,
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
      statusCode: 500,
    });
    console.log("Error deleting product", error);
  }
});

export default productDelete;
