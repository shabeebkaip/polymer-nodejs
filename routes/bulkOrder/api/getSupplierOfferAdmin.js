import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listSupplierOffers = express.Router();

listSupplierOffers.get("/list", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const offers = await SupplierOfferRequest.find()
      .populate("bulkOrderId")
      .populate("supplierId", "firstName lastName email");

    res.status(200).json({ success: true, data: offers });
  } catch (err) {
    console.error("Error fetching supplier offers:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default listSupplierOffers;
