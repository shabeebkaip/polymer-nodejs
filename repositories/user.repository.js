import User from "../models/user.js";
import Product from "../models/product.js";
import { productAggregation } from "./product.repository.js";

/**
 * List users with type filter, search and pagination
 */
export const listUsers = async ({ type, search, page = 1, limit = 10 }) => {
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const filter = {};

  if (type) {
    filter.user_type = type;
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .sort({ _id: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const total = await User.countDocuments(filter);

  return {
    users,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Find user by ID
 */
export const findUserById = async (id) => {
  return await User.findById(id);
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

/**
 * Update user verification status
 */
export const updateVerificationStatus = async (id, status) => {
  return await User.findByIdAndUpdate(
    id,
    { verification: status },
    { new: true }
  );
};

/**
 * Update user profile
 */
export const updateUserProfile = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true });
};

/**
 * List approved sellers with enriched products
 */
export const listSellersWithProducts = async ({ page = 1, limit = 10 }) => {
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const matchStage = {
    user_type: "seller",
    verification: "approved",
  };

  const usersWithProducts = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "createdBy",
        as: "products",
      },
    },
    { $sort: { _id: -1 } },
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },
  ]);

  const enrichedUsers = [];

  for (const user of usersWithProducts) {
    const productIds = user.products.map((p) => p._id);

    let enrichedProducts = [];

    if (productIds.length > 0) {
      enrichedProducts = await Product.aggregate([
        { $match: { _id: { $in: productIds } } },
        ...productAggregation(),
      ]);
    }

    enrichedUsers.push({
      ...user,
      products: enrichedProducts,
    });
  }

  const total = await User.countDocuments(matchStage);

  return {
    users: enrichedUsers,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Get seller detail by ID with enriched products
 */
export const getSellerDetailWithProducts = async (id) => {
  const seller = await User.findOne({
    _id: id,
    user_type: "seller",
    verification: "approved",
  });

  if (!seller) {
    return null;
  }

  // Get products created by the seller
  const products = await Product.find({ createdBy: seller._id }).select("_id");
  const productIds = products.map((p) => p._id);

  let enrichedProducts = [];

  if (productIds.length > 0) {
    enrichedProducts = await Product.aggregate([
      { $match: { _id: { $in: productIds } } },
      ...productAggregation(),
    ]);
  }

  return {
    ...seller.toObject(),
    products: enrichedProducts,
  };
};

/**
 * List buyers with pagination
 */
export const listBuyers = async ({ page = 1, limit = 10 }) => {
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const filter = {
    user_type: "buyer",
  };

  const users = await User.find(filter)
    .sort({ _id: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const total = await User.countDocuments(filter);

  return {
    users,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Create a new user (for expert creation)
 */
export const createUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};
