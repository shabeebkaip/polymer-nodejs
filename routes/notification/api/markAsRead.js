import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Notification from "../../../models/notification.js";

const markAsRead = express.Router();

markAsRead.patch("/:id/read", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default markAsRead;
