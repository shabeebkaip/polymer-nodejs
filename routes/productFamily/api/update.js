import express from "express";
import productFamily from "../../../models/productFamily.js";
const productFamilyUpdate = express.Router();

productFamilyUpdate.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const product = await productFamily.findByIdAndUpdate(id, data);
    if (!product) {
      return res.status(404).json({ status: false, message: "not found" });
    }
    res.status(200).json({
      success: true,
      message: "Product Family updated successfully",
    });
  } catch {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
});

export default productFamilyUpdate;
