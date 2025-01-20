import express from "express";
import Product from "../../../models/product.js";

const products = express.Router();

products.get("", async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query;
    const query = name ? { name: { $regex: name, $options: "i" } } : {};
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      message: "Products fetched successfully",
      success: true,
      statusCode: 200,
      data: {
        list: products,
        pagination: {
          total,
          limit: parseInt(limit),
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error getting products", error);
  }
});

products.get("/:id", async (req, res) => {
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

export default products;
