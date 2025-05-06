import express from "express";
import PhysicalForm from "../../../models/physicalForm.js";

const updatePhysicalForm = express.Router();

updatePhysicalForm.put("/:id", async (req, res) => {
  try {
    const physicalForm = await PhysicalForm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "Physical Form updated successfully",
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
    console.log("Error updating physical form", error);
  }
});

export default updatePhysicalForm;
