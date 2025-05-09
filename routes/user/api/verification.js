import express from "express";
import User from "../../../models/user.js";

const verifyUser = express.Router();

verifyUser.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { verification } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected"];
    if (!allowedStatuses.includes(verification)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updateVerification = await User.findByIdAndUpdate(
      id,
      { verification },
      { new: true }
    );

    if (!updateVerification) {
      return res.status(404).json({ error: "user not found." });
    }

    res.status(200).json({
      success: true,
      message: "updated successfully.",
      data: updateVerification,
    });
  } catch (err) {
    console.error("Error updating verification status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default verifyUser;
