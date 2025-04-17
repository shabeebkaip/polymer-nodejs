import express from "express";
import productFamily from "../../../models/productFamily.js";

const productFamilyGet = express.Router();

productFamilyGet.post("", async (req, res) => {
  try {
    const totalProductFamily = await productFamily.countDocuments({});
    const products = await productFamily.find({});

    res.status(200).json({
      data: products,
      success: true,
      message: "Product family fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default productFamilyGet;
