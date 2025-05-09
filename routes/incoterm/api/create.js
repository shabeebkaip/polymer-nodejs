import express from "express";
import Incoterm from "../../../models/incoterm.js";

const incotermCreate = express.Router();

incotermCreate.post("", async (req, res) => {
  try {
    const newIncoterm = new Incoterm(req.body);
    await newIncoterm.save();
    res.status(200).json({
      success: true,
      message: "Incoterm created successfully",
      status: true,
      chemical: newIncoterm,
    });
  } catch (error) {
    console.log("Error creating category", error);
  }
});

export default incotermCreate;
