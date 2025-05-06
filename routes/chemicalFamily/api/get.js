import express from "express";
import ChemicalFamily from "../../../models/chemicalFamily.js";


const chemicalFamilyGet = express.Router();

chemicalFamilyGet.get("", async (req, res) => {
  try {
    const chemicalFamily = await ChemicalFamily.find({});
    res.status(200).json({
      message: "fetched successfully",
      success: true,
      statusCode: 200,
      data: chemicalFamily,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching chemicalFamily", error);
  }
});

export default chemicalFamilyGet;
