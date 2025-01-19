import express from "express";
import Industry from "../../../models/industry.js";

const getIndustry = express.Router();

getIndustry.get("", async (req, res) => {
  try {
    const industries = await Industry.find();
    res.status(200).json({
      message: "Industries fetched successfully",
      success: true,
      statusCode: 200,
      data: industries,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching industries", error);
  }
});

export default getIndustry;
