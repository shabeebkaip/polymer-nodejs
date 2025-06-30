import express from "express";
import SupplierOfferRequest from "../../../models/supplierOfferRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const listSupplierOffers = express.Router();

listSupplierOffers.get(
  "/list",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalOffers = await SupplierOfferRequest.countDocuments();

      const offers = await SupplierOfferRequest.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate({
          path: "bulkOrderId",
          populate: {
            path: "product", // This ensures the actual product document is populated
            model: "Product", // make sure this matches your Product model name
            select: "productName", // select only the product name field
          },
        })
        .populate("supplierId", "firstName lastName email");

      // Optional formatting
      const formattedOffers = offers.map((offer) => {
        const obj = offer.toObject();

        if (obj.supplierId) {
          obj.supplierId.name = `${obj.supplierId.firstName} ${obj.supplierId.lastName}`;
          delete obj.supplierId.firstName;
          delete obj.supplierId.lastName;
        }

        return obj;
      });

      res.status(200).json({
        success: true,
        data: formattedOffers,
        total: totalOffers,
        page,
        totalPages: Math.ceil(totalOffers / limit),
      });
    } catch (err) {
      console.error("Error fetching supplier offers:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default listSupplierOffers;
