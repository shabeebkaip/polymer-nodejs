import express from "express";
import PackagingType from "../../../models/packagingType.js";

const createPackagingType = express.Router();

createPackagingType.post("", async (req, res) => {
  try {
    const packagingType = new PackagingType(req.body);
    await packagingType.save();
    res.status(201).json({
      message: "Packaging type created successfully",
      success: true,
      statusCode: 201,
      data: packagingType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Packaging type server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating Packaging type", error);
  }
});

export default createPackagingType;
