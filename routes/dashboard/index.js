import express from "express";
import DashboardController from "../../controllers/dashboard.controller.js";
import { authenticateUser, authorizeRoles } from "../../middlewares/verify.token.js";

const dashboardRouter = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard based on authenticated user type (auto-detect)
 * @access  Private (All authenticated users)
 */
dashboardRouter.get("/", authenticateUser, DashboardController.getDashboard);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard with all platform analytics
 * @access  Private (SuperAdmin only)
 */
dashboardRouter.get(
  "/admin",
  authenticateUser,
  authorizeRoles("superAdmin"),
  DashboardController.getAdminDashboard
);

/**
 * @route   GET /api/dashboard/buyer
 * @desc    Get buyer-specific dashboard analytics
 * @access  Private (Buyer only)
 */
dashboardRouter.get(
  "/buyer",
  authenticateUser,
  authorizeRoles("buyer"),
  DashboardController.getBuyerDashboard
);

/**
 * @route   GET /api/dashboard/seller
 * @desc    Get seller-specific dashboard analytics
 * @access  Private (Seller only)
 */
dashboardRouter.get(
  "/seller",
  authenticateUser,
  authorizeRoles("seller"),
  DashboardController.getSellerDashboard
);

/**
 * @route   GET /api/dashboard/user/:userType/:userId
 * @desc    Get dashboard for a specific user (Admin viewing other user's dashboard)
 * @access  Private (SuperAdmin only)
 */
dashboardRouter.get(
  "/user/:userType/:userId",
  authenticateUser,
  authorizeRoles("superAdmin"),
  DashboardController.getUserDashboard
);

/**
 * @route   POST /api/dashboard/cache/invalidate
 * @desc    Invalidate all dashboard caches
 * @access  Private (SuperAdmin only)
 */
dashboardRouter.post(
  "/cache/invalidate",
  authenticateUser,
  authorizeRoles("superAdmin"),
  DashboardController.invalidateCache
);

export default dashboardRouter;
