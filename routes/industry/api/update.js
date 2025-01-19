import express from "express";
import Industry from "../../../models/industry.js";

const updateIndustry = express.Router();

updateIndustry.put("/:id", async (req, res) => {
  try {
    const industry = await Industry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "Industry updated successfully",
      success: true,
      statusCode: 200,
      data: industry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error updating industry", error);
  }
});

export default updateIndustry;
