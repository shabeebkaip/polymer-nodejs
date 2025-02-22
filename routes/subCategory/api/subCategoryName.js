import express from "express";
import SubCategory from "../../../models/subCategory.js";

const subCategoryName = express.Router();

subCategoryName.get("", async (req, res) => {
  try {
    const categories = await SubCategory.find({});
    res.status(200).json({
      status: true,
      data: categories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

export default subCategoryName;
