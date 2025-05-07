import express from "express";
import SampleRequest from "../../../models/sampleRequest.js";

const updateSampleStatus = express.Router();

updateSampleStatus.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected", "fulfilled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updatedRequest = await SampleRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Sample request not found." });
    }

    res.status(200).json({
      message: "Status updated successfully.",
      data: updatedRequest,
    });
  } catch (err) {
    console.error("Error updating Sample request status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default updateSampleStatus;
