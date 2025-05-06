import express from "express";
import PackagingType from "../../../models/packagingType.js";

const deletePackagingType = express.Router();

deletePackagingType.delete("/:id", async (req, res) => {
  try {
    await PackagingType.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Packaging type deleted successfully",
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error deleting Packaging Type form", error);
  }
});

export default deletePackagingType;
