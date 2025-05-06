import express from "express";
import Incoterm from "../../../models/incoterm.js";

const incotermDelete = express.Router();

incotermDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Incoterm.findByIdAndDelete(id);
    res.status(200).json({
      message: "incoterm deleted successfully",
      status: true,
    
    });
  } catch (error) {
    console.log("Error deleting incoterm", error);
    res.status(500).json({
      message: "Error deleting incoterm",
      success: false,
      statusCode: 500,
    });
  }
});

export default incotermDelete;
