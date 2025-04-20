import express from "express";
import productFamily from "../../../models/productFamily.js";

const productFamilyCreate = express.Router();

productFamilyCreate.post("", async (req, res) => {
  try {
    const newProductFamily = new productFamily(req.body);
    await newProductFamily.save();
    res.status(201).json({
      message: "Product Family created successfully",
      success: true,
      data: newProductFamily,
    });
  } catch (error) {
    console.log("Error creating product family", error);
  }
});

export default productFamilyCreate;
