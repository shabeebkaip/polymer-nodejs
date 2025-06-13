import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const editBestDeal = express.Router();

editBestDeal.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { offerPrice } = req.body;

    const bestDeal = await BestDeal.findById(id);

    if (!bestDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Optional: check if req.user.id matches bestDeal.sellerId

    bestDeal.offerPrice = offerPrice;
    bestDeal.status = "pending"; // Reset to pending
    await bestDeal.save();

    res.status(200).json({ message: "Deal updated and re-submitted for approval", bestDeal });
  } catch (err) {
    console.error("Error editing best deal:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default editBestDeal;
