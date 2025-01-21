import express from "express";
import productFamily from "../../../models/productFamily.js";


const ProductFamilyDelete = express.Router();

ProductFamilyDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await productFamily.findByIdAndDelete(id);
    res.status(200).json({
      message: "product family deleted successfully",
      status: true,
    
    });
  } catch (error) {
    console.log("Error deleting product family", error);
    res.status(500).json({
      message: "Error deleting product family",
      success: false,
      statusCode: 500,
    });
  }
});

export default ProductFamilyDelete;
