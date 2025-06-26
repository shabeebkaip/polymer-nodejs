import express from "express";
import ShippingMethod from "../../../models/shippingMethod.js";

const deleteShippingMethod = express.Router();

deleteShippingMethod.delete("/:id", async (req, res) => {
  try {
    const shippingMethod = await ShippingMethod.findByIdAndDelete(req.params.id);

    if (!shippingMethod) {
      return res.status(404).json({
        message: "Shipping Method not found",
        success: false,
        statusCode: 404,
      });
    }

    res.status(200).json({
      message: "Shipping Method deleted successfully",
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error deleting Shipping Method", error);
  }
});

export default deleteShippingMethod