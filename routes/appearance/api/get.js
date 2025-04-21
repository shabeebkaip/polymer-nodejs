import express from "express";
import Appearance from "../../../models/appearance.js";

const getAppearance = express.Router();

getAppearance.get("", async (req, res) => {
  try {
    const appearances = await Appearance.find();
    res.status(200).json({
      success: true,
      message: "Appearance list fetched successfully",
      data: appearances,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

export default getAppearance;
