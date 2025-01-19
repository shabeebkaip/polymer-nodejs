import express from "express";
import Brand from "../../../models/brand.js";

const brandUpdate = express.Router();

brandUpdate.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndUpdate(id, req.body, { new: true });
    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
        success: false,
        statusCode: 404,
      });
    }
    res.status(200).json({
      message: "Brand updated successfully",
      success: true,
      statusCode: 200,
      data: brand,
    });
  } catch (error) {
    console.error("Error updating brand", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
  }
});

export default brandUpdate;
