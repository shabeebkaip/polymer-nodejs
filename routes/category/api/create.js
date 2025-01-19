import Category from "../../../models/category.js";
import express from "express";

const categoryCreate = express.Router();

categoryCreate.post("", async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(200).json({
      message: "Category created successfully",
      status: true,
      category: newCategory,
    });
  } catch (error) {
    console.log("Error creating category", error);
  }
});

export default categoryCreate;
