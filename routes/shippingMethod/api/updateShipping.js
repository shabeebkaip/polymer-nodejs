import express from "express";
import ShippingMethod from "../../../models/shippingMethod.js"; 

const updateShippingMethod = express.Router();

updateShippingMethod.put("/:id", async (req, res) => {
  try {
    const shippingMethod = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, {
      new: true, 
    });

    if (!shippingMethod) {
      return res.status(404).json({
        message: "Shipping Method not found",
        success: false,
        statusCode: 404,
      });
    }

    res.status(200).json({
      message: "Shipping Method updated successfully",
      success: true,
      statusCode: 200,
      data: shippingMethod,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error updating Shipping Method", error);
  }
});

export default updateShippingMethod;