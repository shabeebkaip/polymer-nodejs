import express from "express";
import SubCategory from "../../../models/subCategory.js";

const subCategoryCreate = express.Router();

subCategoryCreate.post("", async (req, res) => {
  try {
    const newCategory = new SubCategory(req.body);
    await newCategory.save();
    res.status(200).json({
      message: " Sub Category created successfully",
      status: true,
      category: newCategory,
    });
  } catch (error) {
    console.log("Error creating  sub category", error);
  }
});

export default subCategoryCreate;

