import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminDecision = express.Router();

adminDecision.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("superAdmin"), // Ensure only admin can access
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status provided. Must be 'approved' or 'rejected'." });
      }

      const bestDeal = await BestDeal.findById(id);
      if (!bestDeal) {
        return res.status(404).json({ message: "Best deal not found" });
      }

      // Update status only if it's different
      if (bestDeal.status !== status || bestDeal.adminNote !== adminNote) {
        bestDeal.status = status;
        bestDeal.adminNote = adminNote || "";
        await bestDeal.save();
      }

      res.status(200).json({ message: `Best deal ${status} successfully`, bestDeal });
    } catch (err) {
      console.error("Admin decision error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default adminDecision;
