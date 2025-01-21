import express from "express";
import Cart from "../../../models/cart.js";

const cartCreate = express.Router();

cartCreate.post("", async (req, res) => {
  try {
    const newCart = new Cart(req.body);
    await newCart.save();
    res.status(201).json({
      message: "cart created successfully",
      success: true,
      statusCode: 201,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating brand", error);
  }
});

export default cartCreate;
