import express from "express";
import productFamily from "../../../models/productFamily.js";

const productFamilyGet = express.Router();

productFamilyGet.get("", async (req, res) => {
  try {
    const { page, limit } = req.query;

    const sort = { _id: -1 };

    if (!page && !limit) {
      const products = await productFamily.find().sort(sort);
      return res.status(200).json({
        data: products,
        success: true,
        message: "Product family fetched successfully",
      });
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit parameters",
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [products, totalCount] = await Promise.all([
      productFamily.find().skip(skip).limit(limitNumber),
      productFamily.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      data: products,
      success: true,
      message: "Product family fetched successfully",
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default productFamilyGet;
