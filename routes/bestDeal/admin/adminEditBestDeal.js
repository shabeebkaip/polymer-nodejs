// adminEditBestDeal.js

import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminEditBestDeal = express.Router();

adminEditBestDeal.put("/:id", authenticateUser, authorizeRoles("superAdmin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedDeal = await BestDeal.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedDeal) {
      return res.status(404).json({ error: "Best deal not found" });
    }

    res.status(200).json({ message: "Best deal updated successfully", bestDeal: updatedDeal });
  } catch (err) {
    console.error("Best deal update error:", err);
    res.status(500).json({ error: "Failed to update best deal" });
  }
});

export default adminEditBestDeal;
