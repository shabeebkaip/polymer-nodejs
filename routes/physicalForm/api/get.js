import express from "express";
import PhysicalForm from "../../../models/physicalForm.js";

const getPhysicalForm = express.Router();

getPhysicalForm.get("", async (req, res) => {
  try {
    const physicalForm = await PhysicalForm.find();
    res.status(200).json({
      message: "Physical Form fetched successfully",
      success: true,
      statusCode: 200,
      data: physicalForm,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching physical form", error);
  }
});

export default getPhysicalForm;
