import express from "express";
import Category from "../../../models/category.js";

const chemicalFamilyDelete = express.Router();

chemicalFamilyDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({
      message: "chemical family deleted successfully",
      status: true,
    
    });
  } catch (error) {
    console.log("Error deleting chemical family", error);
    res.status(500).json({
      message: "Error deleting chemical family",
      success: false,
      statusCode: 500,
    });
  }
});

export default chemicalFamilyDelete;
