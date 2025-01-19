import express from "express";
import SubCategory from "../../../models/subCategory.js";

const subCategoryDelete = express.Router();

subCategoryDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findByIdAndDelete(id);
    res.status(200).json({
      message: "SubCategory deleted successfully",
      status: true,
      data: subCategory,
    });
  } catch (error) {
    console.error("Error deleting subCategory", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
  }
});

export default subCategoryDelete;
