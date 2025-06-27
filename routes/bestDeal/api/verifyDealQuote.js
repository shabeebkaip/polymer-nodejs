import express from "express";
import DealQuoteRequest from "../../../models/dealQuoteRequest.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const verifyDealQuoteBySeller = express.Router();

verifyDealQuoteBySeller.patch("/seller/verify/:id", authenticateUser, authorizeRoles("seller"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusMessage } = req.body;
    const sellerId = req.user.id;

    // Validate status
    const validStatuses = [
      "pending", "accepted", "in_progress", "shipped", 
      "delivered", "completed", "cancelled", "rejected"
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }

    // Find the quote and check ownership
    const quote = await DealQuoteRequest.findById(id).populate("bestDealId");

    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote request not found" });
    }

    if (quote.bestDealId?.sellerId?.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to verify this quote" });
    }

    // Create status message entry
    const newStatusMessage = {
      status: status,
      message: statusMessage || `Status updated to ${status}`,
      date: new Date(),
      updatedBy: "seller"
    };
    
    // Update the quote with new status and push status message
    const updatedQuote = await DealQuoteRequest.findByIdAndUpdate(
      id,
      { 
        status: status,
        $push: { statusMessage: newStatusMessage }
      },
      { new: true }
    ).populate("bestDealId")
     .populate("buyerId", "firstName lastName company");

    if (!updatedQuote) {
      return res.status(404).json({ 
        success: false, 
        message: "Failed to update deal quote request" 
      });
    }

    res.status(200).json({
      success: true,
      message: `Deal quote status updated to '${status}' successfully`,
      data: updatedQuote
    });
  } catch (err) {
    console.error("Seller verify quote error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
});

export default verifyDealQuoteBySeller;