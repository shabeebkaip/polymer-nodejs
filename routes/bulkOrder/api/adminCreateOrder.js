import express from "express";
import BulkOrder from "../../../models/bulkOrder.js";
import Product from "../../../models/product.js"; // ✅ Add this import
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminCreateBulkOrder = express.Router();

adminCreateBulkOrder.post(
  "/",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      const {
        product,
        quantity,
        uom,
        city,
        country,
        destination,
        delivery_date,
      } = req.body;

      // Log to debug
      console.log("User:", req.user);
      console.log("Body:", req.body);

      if (
        !product ||
        !quantity ||
        !uom ||
        !city ||
        !country ||
        !destination ||
        !delivery_date
      ) {
        return res
          .status(400)
          .json({ success: false, error: "All fields are required." });
      }

      const prod = await Product.findById(product);
      if (!prod) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid product selected." });
      }

      const order = new BulkOrder({
        product,
        user: req.user.id,
        quantity,
        uom,
        city,
        country,
        destination,
        delivery_date,
      });

      const saved = await order.save();

      res.status(201).json({
        success: true,
        message: "Bulk order created successfully",
        data: saved,
      });
    } catch (err) {
      console.error("Bulk Order Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default adminCreateBulkOrder;