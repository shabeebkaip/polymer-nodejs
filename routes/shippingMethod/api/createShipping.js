import express from "express";
import ShippingMethod from "../../../models/shippingMethod.js";

const createShippingMethod = express.Router();

createShippingMethod.post("", async (req, res) => {
  try {
    const shippingMethod = new ShippingMethod(req.body);
    await shippingMethod.save();

    res.status(201).json({
      message: "Shipping Method created successfully",
      success: true,
      statusCode: 201,
      data: shippingMethod,
    });
  } catch (error) {
    res.status(500).json({
      message: "Shipping Method server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating Shipping Method", error);
  }
});

export default createShippingMethod;
