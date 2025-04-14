import express from "express";
import Category from "../../../models/category.js";

const categoryGet = express.Router();

categoryGet.post("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = {} } = req.body;

    const currentPage = parseInt(page);
    const perPage = parseInt(limit);

    const totalCategories = await Category.countDocuments(filter);
    const categories = await Category.find(filter)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      status: true,
      message: "Categories fetched successfully",
      data: {
        list: categories,
        pagination: {
          totalItems: totalCategories,
          totalPages: Math.ceil(totalCategories / perPage),
          currentPage,
          perPage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default categoryGet;
