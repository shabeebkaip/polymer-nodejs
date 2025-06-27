import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const getSupplierOffersForBuyer = express.Router();

getSupplierOffersForBuyer.get("/buyer/:bulkOrderId", authenticateUser, async (req, res) => {
  try {
    const { bulkOrderId } = req.params;

    const offers = await SupplierOfferRequest.find({ bulkOrderId })
      .populate("supplierId", "firstName lastName email company")
      .populate({
        path: "bulkOrderId",
        select: "product quantity uom city country delivery_date"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (err) {
    console.error("Error fetching offers for buyer:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
});

export default getSupplierOffersForBuyer;
