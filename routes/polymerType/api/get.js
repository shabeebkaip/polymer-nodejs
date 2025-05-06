import express from "express";
import PolymerType from "../../../models/polymerType.js";

const getPolymerType = express.Router();

getPolymerType.get("", async (req, res) => {
  try {
    const PolymerTypes = await PolymerType.find({});
    res.status(200).json({
      message: "PolymerTypes fetched successfully",
      success: true,
      statusCode: 200,
      data: PolymerTypes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching PolymerTypes", error);
  }
});

export default getPolymerType;
