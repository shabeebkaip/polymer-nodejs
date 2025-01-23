import express from "express";
import Brand from "../../../models/brand.js";

const brandCreate = express.Router();

brandCreate.post("", async (req, res) => {
  try {
    const newBrand = new Brand(req.body);
    await newBrand.save();
    res.status(200).json({
      message: "Brand created successfully",
      status: true,
      statusCode: 200,
      brand: newBrand,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
      statusCode: 500,
    });
    console.log("Error creating brand", error);
  }
});

export default brandCreate;
