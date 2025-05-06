import express from "express";
import PackagingType from "../../../models/packagingType.js";

const updatePackagingType = express.Router();

updatePackagingType.put("/:id", async (req, res) => {
  try {
    const packagingType = await PackagingType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "Packaging type Form updated successfully",
      success: true,
      statusCode: 200,
      data: packagingType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error updating Packaging type", error);
  }
});

export default updatePackagingType;
