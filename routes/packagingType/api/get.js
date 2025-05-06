import express from "express";
import PackagingType from "../../../models/packagingType.js";

const getPackagingType = express.Router();

getPackagingType.get("", async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (!page && !limit) {
      const packagingType = await PackagingType.find();
      return res.status(200).json({
        message: "Packaging types fetched successfully",
        success: true,
        statusCode: 200,
        data: packagingType,
      });
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      return res.status(400).json({
        message: "Invalid page or limit parameters",
        success: false,
        statusCode: 400,
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [packagingType, totalCount] = await Promise.all([
      PackagingType.find().skip(skip).limit(limitNumber),
      PackagingType.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      message: "Packaging types fetched successfully",
      success: true,
      statusCode: 200,
      data: packagingType,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching Packaging type", error);
  }
});

export default getPackagingType;
