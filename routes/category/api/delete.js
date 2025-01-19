import express from "express";
import Category from "../../../models/category.js";

const categoryDelete = express.Router();

categoryDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({
      message: "Category deleted successfully",
      status: true,
    
    });
  } catch (error) {
    console.log("Error deleting category", error);
    res.status(500).json({
      message: "Error deleting category",
      success: false,
      statusCode: 500,
    });
  }
});

export default categoryDelete;
