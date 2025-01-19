import express from "express";

import Industry from "../../../models/industry.js";

const createIndustry = express.Router();

createIndustry.post("", async (req, res) => {
  try {
    const industry = new Industry(req.body);
    await industry.save();
    res.status(201).json({
      message: "Industry created successfully",
      success: true,
      statusCode: 201,
      data: industry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating industry", error);
  }
});

export default createIndustry;
