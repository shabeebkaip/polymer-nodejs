import express from "express";
import Brand from "../../../models/brand.js";

const brandGet = express.Router();

brandGet.get("", async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json({
      success: true,
      message: "Brand list fetched successfully",
      data: brands,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

export default brandGet;
