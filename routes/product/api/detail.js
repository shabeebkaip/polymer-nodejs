import express from "express";
import Product from "../../../models/product.js";
import Brand from "../../../models/brand.js";
import ChemicalFamily from "../../../models/chemicalFamily.js";
import Category from "../../../models/category.js";
import SubCategory from "../../../models/subCategory.js";
import { getProductAgg } from "../aggregation/product.aggregation.js";

const products = express.Router();

products.post("", async (req, res) => {
  try {
    const {
      id,
      name,
      categoryName,
      brandName,
      chemicalFamilyName,
      subCategoryName,
    } = req.body;

    const parsedQuery = {
      id,
      search: name || "",
      categoryName: Array.isArray(categoryName) ? categoryName : [],
      brandName: Array.isArray(brandName) ? brandName : [],
      chemicalFamilyName: Array.isArray(chemicalFamilyName)
        ? chemicalFamilyName
        : [],
      subCategoryName: Array.isArray(subCategoryName) ? subCategoryName : [],
    };

    const { products } = await getProductAgg(parsedQuery);

    const brands = await Brand.find({}).select("name _id");
    const chemicalFamily = await ChemicalFamily.find({}).select("name _id");
    const categories = await Category.find({}).select("name _id");
    const subCategory = await SubCategory.find({}).select("name _id");

    res.status(200).json({
      message: "Products fetched successfully",
      success: true,
      statusCode: 200,
      data: {
        list: products,
        filters: {
          brands,
          chemicalFamily,
          categories,
          subCategory,
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
    const product = await getProductAgg(req.params.id);
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
