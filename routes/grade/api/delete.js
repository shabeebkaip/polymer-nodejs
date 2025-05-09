import express from "express";
import Grade from "../../../models/grade.js";

const gradeDelete = express.Router();

gradeDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Grade.findByIdAndDelete(id);
    res.status(200).json({
      message: "grade deleted successfully",
      success: true,
    
    });
  } catch (error) {
    console.log("Error deleting grade", error);
    res.status(500).json({
      success: true,
      message: "Error deleting grade",
      success: false,
      statusCode: 500,
    });
  }
});

export default gradeDelete;
