import express from "express";
import PolymerType from "../../../models/polymerType.js";

const getPolymerType = express.Router();

getPolymerType.put("/:id", async (req, res) => {
  try {
    const polymerType = await PolymerType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "Polymer ype Form updated successfully",
      success: true,
      statusCode: 200,
      data: polymerType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error updating Polymer Type", error);
  }
});

export default getPolymerType;
