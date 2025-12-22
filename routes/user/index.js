import express from "express";
import { authenticateUser } from "../../middlewares/verify.token.js";
import * as userController from "../../controllers/user.controller.js";

const router = express.Router();

/**
 * User Routes
 *
 * GET    /user/list           - List users with optional type filter (query: type, page, limit)
 * GET    /user/profile        - Get current user profile (authenticated)
 * PATCH  /user/verification/:id - Update user verification status (body: status)
 * PUT    /user/edit           - Update user profile (authenticated)
 * GET    /user/seller/list    - List approved sellers with products
 * GET    /user/seller/:id     - Get seller detail with products
 * GET    /user/buyer/list     - List buyers
 * POST   /user/expert-create  - Create expert user (authenticated, seller only)
 */

// Public routes
router.get("/list", userController.listUsers);
router.get("/seller/list", userController.listSellers);
router.get("/seller/:id", userController.getSellerDetail);
router.get("/buyer/list", userController.listBuyers);

// Admin routes (no auth currently - matches original implementation)
router.patch("/verification/:id", userController.updateVerification);

// Authenticated routes
router.get("/profile", authenticateUser, userController.getProfile);
router.put("/edit", authenticateUser, userController.updateProfile);
router.post("/expert-create", authenticateUser, userController.createExpert);

export default router;
