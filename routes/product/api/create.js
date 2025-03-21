import express from "express";
import Product from "../../../models/product.js";

const productCreate = express.Router();

productCreate.post("", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(200).json({
      message: "Product created successfully",
      status: true,
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
      statusCode: 500,
    });
    console.log("Error creating product", error);
  }
  
});

export default productCreate;
