import express from "express";
import PolymerType from "../../../models/polymerType.js";

const createPolymerType = express.Router();

createPolymerType.post("", async (req, res) => {
  try {
    const polymerType = new PolymerType(req.body);
    await polymerType.save();
    res.status(201).json({
      message: "Polymer Type created successfully",
      success: true,
      statusCode: 201,
      data: packagingType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Polymer Type server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating Polymer Type", error);
  }
});

export default createPolymerType;
