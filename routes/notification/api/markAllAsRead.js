import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Notification from "../../../models/notification.js";

const markAllAsRead = express.Router();

markAllAsRead.patch("/read-all", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default markAllAsRead;
