import express from "express";
import PaymentTerms from "../../../models/paymentTerms.js";


const createPaymentTerms = express.Router();

createPaymentTerms.post("", async (req, res) => {
  try {
    const paymentTerms = new PaymentTerms(req.body);
    await paymentTerms.save();
    res.status(201).json({
      message: "Packaging type created successfully",
      success: true,
      statusCode: 201,
      data: paymentTerms,
    });
  } catch (error) {
    res.status(500).json({
      message: "Packaging type server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error creating Packaging type", error);
  }
});

export default createPaymentTerms;
