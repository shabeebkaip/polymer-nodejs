import mongoose from "mongoose";
import User from "../models/user.js";
import Product from "../models/product.js";

const defaultFindUser = (query) => User.findOne(query);
const defaultCountActiveListings = (sellerId) => Product.countDocuments({ createdBy: sellerId });
const defaultIsValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Convert an existing account's role (buyer<->seller) in place — same _id, Auth untouched.
 * Injectable deps for testing without a real DB (mirrors ai.controller.js's createXHandler pattern).
 */
export const createConvertRoleHandler = ({
  findUser = defaultFindUser,
  countActiveListings = defaultCountActiveListings,
  isValidId = defaultIsValidId,
} = {}) => async (req, res) => {
  try {
    let { email, userId, user_type, company, vat_number, website, location, address, industry } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        status: false,
        message: "Provide either email or userId to identify the account to convert.",
      });
    }

    if (!["buyer", "seller"].includes(user_type)) {
      return res.status(400).json({
        status: false,
        message: "user_type must be 'buyer' or 'seller'",
      });
    }

    let query;
    if (userId) {
      if (!isValidId(userId)) {
        return res.status(400).json({ status: false, message: "userId is not a valid id." });
      }
      query = { _id: userId };
    } else {
      query = { email: email.toLowerCase().trim() };
    }

    const user = await findUser(query);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "No account found for the given email/userId.",
      });
    }

    // Idempotent no-op: already the target role.
    if (user.user_type === user_type) {
      return res.status(200).json({
        status: true,
        message: `User is already a ${user_type}. No changes made.`,
        data: { _id: user._id, email: user.email, user_type: user.user_type, company: user.company },
      });
    }

    // Decision #3: buyer->seller requires company; vat_number/website optional, filled later.
    if (user_type === "seller" && !company?.trim()) {
      return res.status(400).json({
        status: false,
        message: "company is required to convert an account to seller.",
      });
    }

    // Decision #5: block seller->buyer demotion if the seller still owns active listings.
    // ponytail: Product schema has no soft-delete/isActive flag, so "active" = any product
    // doc owned by this seller. Revisit if/when listings gain an archived/inactive state.
    if (user_type === "buyer" && user.user_type === "seller") {
      const activeListingCount = await countActiveListings(user._id);
      if (activeListingCount > 0) {
        return res.status(409).json({
          status: false,
          message: `Cannot demote to buyer: this seller has ${activeListingCount} active product listing(s). Reassign or deactivate them first.`,
        });
      }
    }

    user.user_type = user_type;
    if (company !== undefined) user.company = company;
    if (vat_number !== undefined) user.vat_number = vat_number;
    if (website !== undefined) user.website = website;
    if (location !== undefined) user.location = location;
    if (address !== undefined) user.address = address;
    if (industry !== undefined) user.industry = industry;
    if (user_type === "seller") user.verification = "pending"; // stays pending until VAT/website etc. complete

    await user.save();

    return res.status(200).json({
      status: true,
      message: `Account converted to ${user_type} successfully.`,
      data: {
        _id: user._id,
        email: user.email,
        user_type: user.user_type,
        company: user.company,
        vat_number: user.vat_number,
        website: user.website,
        verification: user.verification,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const convertRole = createConvertRoleHandler();
