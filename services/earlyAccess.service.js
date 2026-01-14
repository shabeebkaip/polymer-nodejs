import EarlyAccess from "../models/earlyAccess.js";
import emailService from "./email.service.js";

class EarlyAccessService {
  /**
   * Submit early access request
   */
  async submitRequest({ email, userType, ipAddress, userAgent }) {
    try {
      // Check if already exists
      const existing = await EarlyAccess.findOne({ email, userType });
      
      if (existing) {
        return {
          success: false,
          message: "You have already requested early access with this email.",
          data: existing,
        };
      }

      // Create new request
      const request = await EarlyAccess.create({
        email,
        userType,
        ipAddress,
        userAgent,
      });

      // Send confirmation email to user
      await this.sendUserConfirmationEmail(email, userType);

      // Send notification to admin
      await this.sendAdminNotificationEmail(email, userType);

      return {
        success: true,
        message: "Thank you! Your early access request has been submitted successfully.",
        data: request,
      };
    } catch (error) {
      console.error("Error submitting early access request:", error);
      throw error;
    }
  }

  /**
   * Send confirmation email to user
   */
  async sendUserConfirmationEmail(email, userType) {
    try {
      await emailService.sendEarlyAccessConfirmation(email, userType);
    } catch (error) {
      console.error("Failed to send user confirmation email:", error);
      // Don't throw - email failure shouldn't block the request
    }
  }

  /**
   * Send notification email to admin
   */
  async sendAdminNotificationEmail(email, userType) {
    try {
      const adminEmail = process.env.EMAIL || "info@polymershub.com";
      await emailService.sendEarlyAccessAdminNotification(
        adminEmail,
        email,
        userType
      );
    } catch (error) {
      console.error("Failed to send admin notification email:", error);
      // Don't throw - email failure shouldn't block the request
    }
  }

  /**
   * Get all early access requests (Admin)
   */
  async getAllRequests({ status, userType, page = 1, limit = 50, search }) {
    try {
      const query = {};

      if (status) {
        query.status = status;
      }

      if (userType) {
        query.userType = userType;
      }

      if (search) {
        query.email = { $regex: search, $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        EarlyAccess.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        EarlyAccess.countDocuments(query),
      ]);

      return {
        success: true,
        data: requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching early access requests:", error);
      throw error;
    }
  }

  /**
   * Get early access statistics (Admin)
   */
  async getStatistics() {
    try {
      const [total, byStatus, byUserType, recentRequests] = await Promise.all([
        EarlyAccess.countDocuments(),
        EarlyAccess.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        EarlyAccess.aggregate([
          {
            $group: {
              _id: "$userType",
              count: { $sum: 1 },
            },
          },
        ]),
        EarlyAccess.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select("email userType status createdAt")
          .lean(),
      ]);

      return {
        success: true,
        data: {
          total,
          byStatus: byStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byUserType: byUserType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recentRequests,
        },
      };
    } catch (error) {
      console.error("Error fetching early access statistics:", error);
      throw error;
    }
  }

  /**
   * Update early access request status (Admin)
   */
  async updateStatus(id, status, notes) {
    try {
      const updateData = { status, notes };

      if (status === "contacted") {
        updateData.contactedAt = new Date();
      } else if (status === "approved") {
        updateData.approvedAt = new Date();
      }

      const request = await EarlyAccess.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!request) {
        return {
          success: false,
          message: "Early access request not found",
        };
      }

      return {
        success: true,
        message: "Status updated successfully",
        data: request,
      };
    } catch (error) {
      console.error("Error updating early access status:", error);
      throw error;
    }
  }

  /**
   * Delete early access request (Admin)
   */
  async deleteRequest(id) {
    try {
      const request = await EarlyAccess.findByIdAndDelete(id);

      if (!request) {
        return {
          success: false,
          message: "Early access request not found",
        };
      }

      return {
        success: true,
        message: "Request deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting early access request:", error);
      throw error;
    }
  }
}

export default new EarlyAccessService();
