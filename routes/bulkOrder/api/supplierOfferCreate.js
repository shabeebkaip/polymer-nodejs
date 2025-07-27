import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import Notification from "../../../models/notification.js";
import BulkOrder from "../../../models/bulkOrder.js";
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

    // Notify the user who created the bulk order request
    if (bulkOrderId) {
      try {
        const bulkOrder = await BulkOrder.findById(bulkOrderId).populate({
          path: "createdBy",
          select: "_id firstName lastName email",
        });
        if (bulkOrder?.createdBy?._id) {
          await Notification.create({
            userId: bulkOrder.createdBy._id,
            type: "supplier-offer",
            message: "A supplier submitted an offer for your bulk order request.",
            redirectUrl: `/user/product-requests/${bulkOrderId}`,
            relatedId: saved._id,
            meta: {
              supplierId,
              offerId: saved._id,
            },
          });
        }
      } catch (notifyErr) {
        console.error("Failed to notify bulk order creator:", notifyErr);
      }
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Supplier offer create error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

export default createSupplierOffer;
