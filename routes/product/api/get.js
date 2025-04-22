import express from "express";
import { getProductAgg } from "../aggregation/product.aggregation.js";
import { verifyToken } from "../../../middlewares/login.auth.js";

const productGet = express.Router();

productGet.post("", verifyToken, async (req, res) => {
  try {
    const {
      name,
      categoryName,
      brandName,
      chemicalFamilyName,
      subCategoryName,
    } = req.body;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;

    const parsedQuery = {
      search: name || "",
      categoryName: Array.isArray(categoryName) ? categoryName : [],
      brandName: Array.isArray(brandName) ? brandName : [],
      chemicalFamilyName: Array.isArray(chemicalFamilyName)
        ? chemicalFamilyName
        : [],
      subCategoryName: Array.isArray(subCategoryName) ? subCategoryName : [],
      createdBy: req.body.userId, // Filter by authenticated user's _id
    };

    const { products, totalProducts } = await getProductAgg(
      parsedQuery,
      page,
      limit
    );
    // console.log("Products fetched successfully", products);
    res.status(200).json({
      status: true,
      message: "Products fetched successfully",
      products: products,
      totalProducts: totalProducts,
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default productGet;
