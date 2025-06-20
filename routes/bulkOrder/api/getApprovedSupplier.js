import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const getApprovedSupplierOffers = express.Router();

getApprovedSupplierOffers.get("/approved/:bulkOrderId", authenticateUser, async (req, res) => {
  try {
    const { bulkOrderId } = req.params;

    const approvedOffers = await SupplierOfferRequest.find({
      bulkOrderId,
      status: "approved"
    })
      .populate("supplierId", "firstName lastName email company")
      .populate({
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: approvedOffers.length,
      data: approvedOffers
    });
  } catch (err) {
    console.error("Error fetching approved supplier offers:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
});

export default getApprovedSupplierOffers;
