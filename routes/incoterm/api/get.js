import express from "express";
import Incoterm from "../../../models/incoterm.js";

const getIncoterm = express.Router();

getIncoterm.get("", async (req, res) => {
  try {
    const incoterms = await Incoterm.find({});
    res.status(200).json({
      message: "Incoterms fetched successfully",
      success: true,
      statusCode: 200,
      data: incoterms,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching incoterms", error);
  }
});

export default getIncoterm;
