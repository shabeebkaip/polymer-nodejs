import express from "express";
import Industry from "../../../models/industry.js";

const deleteIndustry = express.Router();

deleteIndustry.delete("/:id", async (req, res) => {
  try {
    await Industry.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Industry deleted successfully",
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error deleting industry", error);
  }
});

export default deleteIndustry;
