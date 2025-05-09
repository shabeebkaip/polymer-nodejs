import express from "express";
import Industry from "../../../models/industry.js";

const getIndustry = express.Router();

getIndustry.get("", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const sort = { _id: -1 };

    if (!page && !limit) {
      const industries = await Industry.find().sort(sort);
      return res.status(200).json({
        message: "Industries fetched successfully",
        success: true,
        statusCode: 200,
        data: industries,
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

    const [industries, totalCount] = await Promise.all([
      Industry.find().skip(skip).limit(limitNumber),
      Industry.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      message: "Industries fetched successfully",
      success: true,
      statusCode: 200,
      data: industries,
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
    console.log("Error fetching industries", error);
  }
});

export default getIndustry;
