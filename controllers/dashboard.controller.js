import DashboardService from "../services/dashboard.service.js";
import { invalidateAllDashboardCache } from "../utils/redis.js";

/**
 * Dashboard Controller - Handles all dashboard analytics requests
 * Supports Redis caching with force refresh option via query param: ?refresh=true
 */
class DashboardController {
  /**
   * Get dashboard analytics based on user type
   * Automatically detects user type and returns appropriate dashboard
   * Query params:
   *   - refresh: true/false - Force refresh cache (default: false)
   */
  async getDashboard(req, res) {
    try {
      const { user } = req;
      const forceRefresh = req.query.refresh === "true";
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      let dashboardData;
      let dashboardType;

      switch (user.user_type) {
        case "superAdmin":
          dashboardData = await DashboardService.getAdminDashboard(forceRefresh);
          dashboardType = "admin";
          break;
        case "buyer":
          dashboardData = await DashboardService.getBuyerDashboard(user.id, forceRefresh);
          dashboardType = "buyer";
          break;
        case "seller":
          dashboardData = await DashboardService.getSellerDashboard(user.id, forceRefresh);
          dashboardType = "seller";
          break;
        default:
          return res.status(403).json({
            success: false,
            message: "Invalid user type for dashboard access",
          });
      }

      return res.status(200).json({
        success: true,
        message: `${dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} dashboard data fetched successfully`,
        dashboardType,
        data: dashboardData,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
        error: error.message,
      });
    }
  }

  /**
   * Get Admin Dashboard - Only for superAdmin users
   * Query params:
   *   - refresh: true/false - Force refresh cache (default: false)
   */
  async getAdminDashboard(req, res) {
    try {
      const { user } = req;
      const forceRefresh = req.query.refresh === "true";

      if (user.user_type !== "superAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      const dashboardData = await DashboardService.getAdminDashboard(forceRefresh);

      return res.status(200).json({
        success: true,
        message: "Admin dashboard data fetched successfully",
        dashboardType: "admin",
        data: dashboardData,
      });
    } catch (error) {
      console.error("Admin dashboard fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch admin dashboard data",
        error: error.message,
      });
    }
  }

  /**
   * Get Buyer Dashboard - Only for buyer users
   * Query params:
   *   - refresh: true/false - Force refresh cache (default: false)
   */
  async getBuyerDashboard(req, res) {
    try {
      const { user } = req;
      const forceRefresh = req.query.refresh === "true";

      if (user.user_type !== "buyer") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Buyer privileges required.",
        });
      }

      const dashboardData = await DashboardService.getBuyerDashboard(user.id, forceRefresh);

      return res.status(200).json({
        success: true,
        message: "Buyer dashboard data fetched successfully",
        dashboardType: "buyer",
        data: dashboardData,
      });
    } catch (error) {
      console.error("Buyer dashboard fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch buyer dashboard data",
        error: error.message,
      });
    }
  }

  /**
   * Get Seller Dashboard - Only for seller users
   * Query params:
   *   - refresh: true/false - Force refresh cache (default: false)
   */
  async getSellerDashboard(req, res) {
    try {
      const { user } = req;
      const forceRefresh = req.query.refresh === "true";

      if (user.user_type !== "seller") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Seller privileges required.",
        });
      }

      const dashboardData = await DashboardService.getSellerDashboard(user.id, forceRefresh);

      return res.status(200).json({
        success: true,
        message: "Seller dashboard data fetched successfully",
        dashboardType: "seller",
        data: dashboardData,
      });
    } catch (error) {
      console.error("Seller dashboard fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch seller dashboard data",
        error: error.message,
      });
    }
  }

  /**
   * Get dashboard for a specific user (Admin only)
   * Allows admin to view any user's dashboard
   * Query params:
   *   - refresh: true/false - Force refresh cache (default: false)
   */
  async getUserDashboard(req, res) {
    try {
      const { user } = req;
      const { userId, userType } = req.params;
      const forceRefresh = req.query.refresh === "true";

      if (user.user_type !== "superAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      let dashboardData;

      switch (userType) {
        case "buyer":
          dashboardData = await DashboardService.getBuyerDashboard(userId, forceRefresh);
          break;
        case "seller":
          dashboardData = await DashboardService.getSellerDashboard(userId, forceRefresh);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid user type. Must be 'buyer' or 'seller'.",
          });
      }

      return res.status(200).json({
        success: true,
        message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} dashboard data fetched successfully`,
        dashboardType: userType,
        userId,
        data: dashboardData,
      });
    } catch (error) {
      console.error("User dashboard fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user dashboard data",
        error: error.message,
      });
    }
  }

  /**
   * Invalidate all dashboard caches (Admin only)
   * POST /api/dashboard/cache/invalidate
   */
  async invalidateCache(req, res) {
    try {
      const { user } = req;

      if (user.user_type !== "superAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      await invalidateAllDashboardCache();

      return res.status(200).json({
        success: true,
        message: "All dashboard caches invalidated successfully",
      });
    } catch (error) {
      console.error("Cache invalidation error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to invalidate cache",
        error: error.message,
      });
    }
  }
}

export default new DashboardController();
