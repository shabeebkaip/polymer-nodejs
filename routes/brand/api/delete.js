import express from "express";
import Brand from "../../../models/brand.js";

const brandDelete = express.Router();

brandDelete.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    res.status(200).json({
      message: "Brand deleted successfully",
      status: true,
      statusCode: 200,
      data: brand,
    });
  } catch (error) {
    console.error("Error deleting brand", error);
    res.status(500).json({
      message: "Internal server error",
      status: false,
      statusCode: 500,
    });
  }
});

export default brandDelete;
