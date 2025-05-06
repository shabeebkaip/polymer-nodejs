import express from "express";
import PaymentTerms from "../../../models/paymentTerms.js";

const getPaymentTerms = express.Router();

getPaymentTerms.get("", async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (!page && !limit) {
      const paymentTerms = await PaymentTerms.find();
      return res.status(200).json({
        message: "Payment Terms fetched successfully",
        success: true,
        statusCode: 200,
        data: paymentTerms,
      });
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      return res.status(400).json({
        message: "Invalid page or limit parameters",
        success: false,
        statusCode: 400,
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [paymentTerms, totalCount] = await Promise.all([
      PaymentTerms.find().skip(skip).limit(limitNumber),
      PaymentTerms.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      message: "Payment Terms fetched successfully",
      success: true,
      statusCode: 200,
      data: paymentTerms,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      statusCode: 500,
    });
    console.log("Error fetching Payment Terms", error);
  }
});

export default getPaymentTerms;
