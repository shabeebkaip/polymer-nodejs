import express from "express";
import PolymerType from "../../../models/polymerType.js";

const deletePolymerType = express.Router();

deletePolymerType.delete("/:id", async (req, res) => {
  try {
    await PolymerType.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Packaging type deleted successfully",
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error deleting Packaging Type form", error);
  }
});

export default deletePolymerType;
