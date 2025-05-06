import express from "express";
import Incoterm from "../../../models/incoterm.js";

const getIncoterm = express.Router();

getIncoterm.get("", async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (!page && !limit) {
      const incoterms = await Incoterm.find({});
      return res.status(200).json({
        message: "Incoterms fetched successfully",
        success: true,
        statusCode: 200,
        data: incoterms,
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

    const [incoterms, totalCount] = await Promise.all([
      Incoterm.find().skip(skip).limit(limitNumber),
      Incoterm.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      message: "Incoterms fetched successfully",
      success: true,
      statusCode: 200,
      data: incoterms,
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
    console.log("Error fetching incoterms", error);
  }
});

export default getIncoterm;
