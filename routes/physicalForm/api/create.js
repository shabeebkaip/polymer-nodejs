import express from "express";
import PhysicalForm from "../../../models/physicalForm.js";

const createPhysicalForm = express.Router();

createPhysicalForm.post("", async (req, res) => {
  try {
    const physicalForm = new PhysicalForm(req.body);
    await physicalForm.save();
    res.status(201).json({
      message: "Physical Form created successfully",
      success: true,
      statusCode: 201,
      data: physicalForm,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating physical form", error);
  }
});

export default createPhysicalForm;
