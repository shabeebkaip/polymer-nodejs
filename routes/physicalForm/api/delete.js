import express from "express";
import PhysicalForm from "../../../models/physicalForm.js";

const deletePhysicalForm = express.Router();

deletePhysicalForm.delete("/:id", async (req, res) => {
  try {
    await PhysicalForm.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Physical Form deleted successfully",
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error deleting physical form", error);
  }
});

export default deletePhysicalForm;
