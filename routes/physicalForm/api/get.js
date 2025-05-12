import express from "express";
import PhysicalForm from "../../../models/physicalForm.js";

const getPhysicalForm = express.Router();

getPhysicalForm.get("", async (req, res) => {
  try {
    const { page, limit } = req.query;

    const sort = { _id: -1 };

    if (!page && !limit) {
      const physicalForm = await PhysicalForm.find().sort(sort);
      return res.status(200).json({
        message: "Physical Form fetched successfully",
        success: true,
        statusCode: 200,
        data: physicalForm,
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

    const [physicalForm, totalCount] = await Promise.all([
      PhysicalForm.find().sort(sort).skip(skip).limit(limitNumber),
      PhysicalForm.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      message: "Physical Form fetched successfully",
      success: true,
      statusCode: 200,
      data: physicalForm,
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
    console.log("Error fetching physical form", error);
  }
});

export default getPhysicalForm;
