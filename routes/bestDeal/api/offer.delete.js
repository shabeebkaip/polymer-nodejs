import express from "express";
import BestDeal from "../../../models/bestDeal.js";
import { authenticateUser } from "../../../middlewares/verify.token.js";

const deleteBestDeal = express.Router();

deleteBestDeal.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const bestDeal = await BestDeal.findById(id);

    if (!bestDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Optional: check if req.user.id matches bestDeal.sellerId

    await bestDeal.deleteOne();
    res.status(200).json({ message: "Deal deleted successfully" });
  } catch (err) {
    console.error("Error deleting best deal:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default deleteBestDeal;
