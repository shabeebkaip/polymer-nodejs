import Notification from "../models/notification.js";

class NotificationController {
  /**
   * Get all notifications for the logged-in user
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = { userId };
      if (unreadOnly === 'true') {
        filter.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, isRead: false }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch notifications",
      });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req, res) {
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
          error: "Notification not found",
        });
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update notification",
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      res.status(200).json({
        success: true,
        data: {
          updatedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update notifications",
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: "Notification not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete notification",
      });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch unread count",
      });
    }
  }
}

export default new NotificationController();
