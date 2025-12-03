import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Notification from "../../../models/notification.js";

const getUnreadCount = express.Router();

getUnreadCount.get("/unread-count", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default getUnreadCount;
