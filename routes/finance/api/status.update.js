import express from "express";
import Finance from "../../../models/finance.js";

const financeRequestStatus = express.Router();

financeRequestStatus.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updatedRequest = await Finance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Finance request not found." });
    }

    res.status(200).json({
      message: "Status updated successfully.",
      data: updatedRequest,
    });
  } catch (err) {
    console.error("Error updating Finance request status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default financeRequestStatus;
