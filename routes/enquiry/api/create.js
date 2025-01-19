import Category from "../../../models/category.js";
import express from "express";
import Enquiry from "../../../models/enquiry.js";

const enquiryCreate = express.Router();

enquiryCreate.post("", async (req, res) => {
  try {
    const newCategory = new Enquiry(req.body);
    await newCategory.save();
    res.status(200).json({
      message: " successfully",
      status: true,
      category: newCategory,
    });
  } catch (error) {
    console.log("Error creating category", error);
  }
});

export default enquiryCreate;
