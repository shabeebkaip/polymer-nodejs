import express from "express";
import PaymentTerms from "../../../models/paymentTerms.js";

const updatePaymentTerms = express.Router();

updatePaymentTerms.put("/:id", async (req, res) => {
  try {
    const paymentTerms = await PaymentTerms.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "payment Terms Form updated successfully",
      success: true,
      statusCode: 200,
      data: paymentTerms,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error updating payment Terms", error);
  }
});

export default updatePaymentTerms;
