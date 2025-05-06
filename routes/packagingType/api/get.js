import express from "express";
import PackagingType from "../../../models/packagingType.js";

const getPackagingType = express.Router();

getPackagingType.get("", async (req, res) => {
  try {
    const packagingType = await PackagingType.find();
    res.status(200).json({
      message: "Packaging type Form fetched successfully",
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
    console.log("Error fetching Packaging type", error);
  }
});

export default getPackagingType;
