import express from "express";
import Substance from "../../../models/substance.js";

const getSubstance = express.Router();

getSubstance.get("", async (req, res) => {
  try {
    const substances = await Substance.find();
    res.status(200).json({
      success: true,
      message: "Substance list fetched successfully",
      data: substances,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

export default getSubstance;
