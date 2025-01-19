import express from "express";
import ChemicalFamily from "../../../models/chemicalFamily.js";

const chemicalFamilyCreate = express.Router();

chemicalFamilyCreate.post("", async (req, res) => {
  try {
    const newChemical = new ChemicalFamily(req.body);
    await newChemical.save();
    res.status(200).json({
      message: "Chemical family created successfully",
      status: true,
      chemical: newChemical,
    });
  } catch (error) {
    console.log("Error creating category", error);
  }
});

export default chemicalFamilyCreate;
