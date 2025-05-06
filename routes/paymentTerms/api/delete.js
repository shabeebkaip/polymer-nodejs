import express from "express";
import PaymentTerms from "../../../models/paymentTerms.js";

const deletePaymentTerms = express.Router();

deletePaymentTerms.delete("/:id", async (req, res) => {
  try {
    await PaymentTerms.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "payment Terms deleted successfully",
      success: true,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error deleting payment Terms form", error);
  }
});

export default deletePaymentTerms;
