import mongoose from "mongoose";
import bcrypt from "bcrypt";
import * as userRepository from "../repositories/user.repository.js";
import Auth from "../models/auth.js";
import { sendAccountCreationEmail } from "../services/email.service.js";
import generateRandomId from "../common/random.js";

/**
 * List users with optional type filter and search
 */
export const listUsers = async ({ type, search, page, limit }) => {
  const result = await userRepository.listUsers({ type, search, page, limit });

  // Add computed name field
  const usersWithName = result.users.map((user) => ({
    ...user.toObject(),
    name: `${user.firstName} ${user.lastName}`,
  }));

  return {
    data: usersWithName,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  };
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  return { success: true, data: user };
};

/**
 * Update user verification status
 */
export const updateVerification = async (id, status) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid user ID" };
  }

  const validStatuses = ["pending", "approved", "rejected"];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
    };
  }

  const user = await userRepository.updateVerificationStatus(id, status);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  return {
    success: true,
    message: `Verification status updated to ${status}`,
    data: user,
  };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, currentEmail, updateData) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // Prevent email change
  if (updateData.email && updateData.email !== currentEmail) {
    return { success: false, message: "You cannot change your email." };
  }

  // Remove email from update data for safety
  const { email, ...safeUpdateData } = updateData;

  const updatedUser = await userRepository.updateUserProfile(
    userId,
    safeUpdateData
  );

  return {
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  };
};

/**
 * List approved sellers with enriched products
 */
export const listSellersWithProducts = async ({ page, limit }) => {
  const result = await userRepository.listSellersWithProducts({ page, limit });

  return {
    data: result.users,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  };
};

/**
 * Get seller detail with enriched products
 */
export const getSellerDetail = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: "Invalid seller ID" };
  }

  const seller = await userRepository.getSellerDetailWithProducts(id);

  if (!seller) {
    return { success: false, message: "Seller not found or not approved" };
  }

  return { success: true, data: seller };
};

/**
 * List buyers with pagination
 */
export const listBuyers = async ({ page, limit }) => {
  const result = await userRepository.listBuyers({ page, limit });

  return {
    data: result.users,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  };
};

/**
 * Create expert user (by seller)
 */
export const createExpert = async (sellerId, expertData) => {
  // Verify the requester is a seller
  const seller = await userRepository.findUserById(sellerId);

  if (!seller || seller.user_type !== "seller") {
    return { success: false, message: "Only sellers can create experts." };
  }

  // Check if expert already exists with this email
  const existingUser = await userRepository.findUserByEmail(expertData.email);

  if (existingUser) {
    return {
      success: false,
      message: "Expert already exists with this email.",
    };
  }

  // Create expert user with seller's company details
  const expertUser = await userRepository.createUser({
    firstName: expertData.firstName,
    lastName: expertData.lastName,
    email: expertData.email,
    company: seller.company,
    website: seller.website,
    industry: seller.industry,
    address: seller.address,
    country_code: expertData.country_code,
    phone: expertData.phone,
    Expert_department: expertData.Expert_department,
    Expert_role: expertData.Expert_role,
    profile_image: expertData.profile_image,
    location: seller.location,
    vat_number: seller.vat_number,
    company_logo: seller.company_logo,
    user_type: "expert",
    verification: "pending",
    sellerId: seller._id,
  });

  // Generate random password
  const companyPrefix = (seller.company || "CO").substring(0, 2).toUpperCase();
  const randomSuffix = generateRandomId(6);
  const password = `${companyPrefix}${randomSuffix}`;

  // Create auth entry
  const hashedPassword = await bcrypt.hash(password, 10);
  const authEntry = new Auth({
    email: expertData.email,
    password: hashedPassword,
    userId: expertUser._id,
  });
  await authEntry.save();

  // Send account creation email
  sendAccountCreationEmail(expertData.firstName, expertData.email, password);

  return { success: true, message: "Expert created successfully and email sent." };
};
