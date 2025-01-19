import express from "express";
import Product from "../../../models/product.js";

const productCreate = express.Router();

productCreate.post("", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      message: "Product created successfully",
      success: true,
      statusCode: 201,
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating product", error);
  }
});

export default productCreate;
