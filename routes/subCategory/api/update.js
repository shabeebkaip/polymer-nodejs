import express from "express";
import SubCategory from "../../../models/subCategory.js";

const subCategoryUpdate = express.Router();

subCategoryUpdate.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    res.status(200).json({
      message: "SubCategory updated successfully",
      success: true,
      statusCode: 200,
      data: updatedSubCategory,
    });
  } catch (error) {
    console.error("Error updating subCategory", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
  }
});

export default subCategoryUpdate;
