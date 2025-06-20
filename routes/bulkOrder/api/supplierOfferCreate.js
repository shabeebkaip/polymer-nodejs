import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const createSupplierOffer = express.Router();

createSupplierOffer.post("/create", authenticateUser, async (req, res) => {
  try {
    const supplierId = req.user.id;
    const {
      bulkOrderId,
      pricePerUnit,
      availableQuantity,
      deliveryTimeInDays,
      incotermAndPackaging,
      message,
    } = req.body;

    const offer = new SupplierOfferRequest({
      supplierId,
      bulkOrderId,
      pricePerUnit,
      availableQuantity,
      deliveryTimeInDays,
      incotermAndPackaging,
      message,
    });

    const saved = await offer.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Supplier offer create error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

export default createSupplierOffer;
