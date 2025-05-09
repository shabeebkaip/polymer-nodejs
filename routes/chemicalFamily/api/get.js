import express from "express";
import ChemicalFamily from "../../../models/chemicalFamily.js";

const chemicalFamilyGet = express.Router();

chemicalFamilyGet.get("/", async (req, res) => {
  try {
    const { page, limit } = req.query;

    const sort = { _id: -1 };

    if (!page && !limit) {
      const chemicalFamily = await ChemicalFamily.find({}).sort(sort);
      return res.status(200).json({
        message: "Fetched successfully",
        success: true,
        statusCode: 200,
        data: chemicalFamily,
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

    const [chemicalFamily, totalCount] = await Promise.all([
      ChemicalFamily.find({}).skip(skip).limit(limitNumber),
      ChemicalFamily.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      message: "Fetched successfully",
      success: true,
      statusCode: 200,
      data: chemicalFamily,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
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
    console.log("Error fetching chemicalFamily", error);
  }
});

export default chemicalFamilyGet;
