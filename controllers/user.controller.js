import * as userService from "../services/user.service.js";

/**
 * GET /user/list
 * List users with optional type filter and search
 */
export const listUsers = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 10 } = req.query;

    const result = await userService.listUsers({ type, search, page, limit });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};

/**
 * GET /user/profile
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await userService.getUserProfile(userId);

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

/**
 * PATCH /user/verification/:id
 * Update user verification status
 */
export const updateVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await userService.updateVerification(id, status);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating verification:", error);
    res.status(500).json({ message: "Server error while updating verification" });
  }
};

/**
 * PUT /user/edit
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentEmail = req.user.email;

    const result = await userService.updateUserProfile(userId, currentEmail, req.body);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

/**
 * GET /user/seller/list
 * List approved sellers with enriched products
 */
export const listSellers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await userService.listSellersWithProducts({ page, limit });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: "Server error while fetching sellers" });
  }
};

/**
 * GET /user/seller/:id
 * Get seller detail with enriched products
 */
export const getSellerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.getSellerDetail(id);

    if (!result.success) {
      const statusCode = result.message.includes("Invalid") ? 400 : 404;
      return res.status(statusCode).json({ message: result.message });
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching seller detail:", error);
    res.status(500).json({ message: "Server error while fetching seller detail" });
  }
};

/**
 * GET /user/buyer/list
 * List buyers with pagination
 */
export const listBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await userService.listBuyers({ page, limit });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    res.status(500).json({ message: "Server error while fetching buyers" });
  }
};

/**
 * POST /user/expert-create
 * Create expert user (by seller)
 */
export const createExpert = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const result = await userService.createExpert(sellerId, req.body);

    if (!result.success) {
      const statusCode = result.message.includes("Only sellers") ? 403 : 400;
      return res.status(statusCode).json({ message: result.message });
    }

    res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Create Expert Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
