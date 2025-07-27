import express from "express";
import { authenticateUser } from "../../../middlewares/verify.token.js";
import Notification from "../../../models/notification.js";

const getUserNotifications = express.Router();

getUserNotifications.get("", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Fetch notifications for the user
    const notifications = await Notification.find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Notification.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
export default getUserNotifications;