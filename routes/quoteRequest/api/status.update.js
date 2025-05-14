import express from "express";
import QuoteRequest from "../../../models/quoteRequest.js";

const updateQuoteStatus = express.Router();

updateQuoteStatus.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected", "fulfilled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updatedRequest = await QuoteRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Quote request not found." });
    }

    res.status(200).json({
      message: "Status updated successfully.",
      data: updatedRequest,
    });
  } catch (err) {
    console.error("Error updating Quote request status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default updateQuoteStatus;
