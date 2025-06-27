import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const verifySupplierOfferByBuyer = express.Router();

verifySupplierOfferByBuyer.patch(
  "/buyer-verify/:id",
  authenticateUser,
  authorizeRoles("buyer"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, buyerNote } = req.body;

      const validStatuses = ["approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const newStatusMessage = {
        status,
        message: buyerNote || `Status updated to ${status}`,
        updatedBy: "buyer",
        date: new Date(),
      };

      const offer = await SupplierOfferRequest.findByIdAndUpdate(
        id,
        {
          status,
          $push: { statusMessage: newStatusMessage },
        },
        { new: true }
      );

      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      res.status(200).json({
        success: true,
        message: `Offer ${status} by buyer`,
        data: offer,
      });
    } catch (err) {
      console.error("Offer verification by buyer failed:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default verifySupplierOfferByBuyer;
