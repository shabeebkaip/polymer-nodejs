import express from "express";
import bcrypt from "bcrypt";
import User from "../../../models/user.js";
import Auth from "../../../models/auth.js";
import { sendAccountCreationEmail } from "../../../services/email.service.js";
import generateRandomId from "../../../common/random.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";
import {
  convertRole,
  convertPreview,
  lookupUser,
  userDetail,
  userActivity,
  userActivitySummary,
} from "../../../controllers/admin.controller.js";

const adminCreateUser = express.Router();
const superAdminOnly = [authenticateUser, authorizeRoles("superAdmin")];

adminCreateUser.post("/create-user", async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      phone,
      country_code,
      user_type,
      company,
      website,
      location,
      address,
      vat_number,
      industry,
    } = req.body;

    email = email?.toLowerCase().trim();

    if (!firstName || !lastName || !email || !user_type) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: firstName, lastName, email, user_type",
      });
    }

    if (!["buyer", "seller"].includes(user_type)) {
      return res.status(400).json({
        status: false,
        message: "user_type must be 'buyer' or 'seller'",
      });
    }

    const existingUser = await User.findOne({ email });
    const existingAuth = await Auth.findOne({ email });

    if (existingUser || existingAuth) {
      return res.status(400).json({
        status: false,
        message: "An account with this email already exists",
      });
    }

    // Generate a readable random password
    const prefix = (company || "PH").substring(0, 2).toUpperCase();
    const password = `${prefix}${generateRandomId(6)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin-created accounts skip email verification entirely
    const newUser = new User({
      firstName,
      lastName,
      email,
      user_type,
      company,
      website,
      location,
      address,
      industry,
      vat_number: user_type === "seller" ? vat_number : undefined,
      // phone is optional when onboarded by admin
      ...(phone ? { phone, country_code } : {}),
      emailVerified: true,
      verification: "approved",
    });

    await newUser.save();

    const newAuth = new Auth({
      email,
      password: hashedPassword,
    });

    await newAuth.save();

    // Send credentials to the user
    sendAccountCreationEmail(firstName, email, password);

    return res.status(201).json({
      status: true,
      message: `${user_type === "seller" ? "Seller" : "Buyer"} account created successfully. Login credentials sent to ${email}.`,
      data: {
        _id: newUser._id,
        firstName,
        lastName,
        email,
        user_type,
        company,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * POST /admin/users/convert-role
 * Convert an existing user's role (buyer<->seller) in place — same _id, Auth untouched.
 * Guarded: superAdmin only. Business logic lives in controllers/admin.controller.js
 * (createConvertRoleHandler) so it's unit-testable without a real DB.
 */
adminCreateUser.post("/convert-role", ...superAdminOnly, convertRole);

/**
 * GET /admin/users/lookup?email=
 * Guarded email pre-check so the dashboard can branch (create vs convert) before
 * attempting a create. Business logic lives in controllers/admin.controller.js
 * (createLookupUserHandler) so it's unit-testable without a real DB.
 */
adminCreateUser.get("/lookup", ...superAdminOnly, lookupUser);

/**
 * GET /admin/users/:id/convert-preview?to=buyer|seller
 * Read-only dry run of a role change — returns the consequences (listings archived/
 * restored, verification reset, company requirement) so the dashboard can show the
 * admin what will happen before they confirm. Guarded: superAdmin only.
 */
adminCreateUser.get("/:id/convert-preview", ...superAdminOnly, convertPreview);

/**
 * GET /admin/users/:id
 * Profile + activity counts for the admin user-detail view. Guarded: superAdmin only.
 * Business logic lives in controllers/admin.controller.js (createUserDetailHandler) so
 * it's unit-testable without a real DB.
 */
adminCreateUser.get("/:id", ...superAdminOnly, userDetail);

/**
 * GET /admin/users/:id/activity?page=1&limit=20
 * Merged, paginated, date-desc activity feed across products/quotes/samples/bulk orders/
 * supplier offers/enquiries. Guarded: superAdmin only. Business logic lives in
 * controllers/admin.controller.js (createUserActivityHandler).
 */
adminCreateUser.get("/:id/activity", ...superAdminOnly, userActivity);

/**
 * GET /admin/users/:id/activity-summary
 * AI-generated 2-4 sentence plain-English summary of the user's activity (role, key
 * activity volumes, notable patterns) for the admin user-detail page. Guarded:
 * superAdmin only. Reuses the same count/feed logic as userDetail/userActivity above
 * (see mergeActivityItems/defaultGetCounts in controllers/admin.controller.js) and
 * falls back to a deterministic non-AI summary if the LLM call fails.
 * NOTE: registered alongside the other "/:id/*" routes above "/:id" — Express only
 * matches "/:id" against a single path segment so it can't shadow this route, but kept
 * here for readability/consistency with the other :id sub-routes.
 */
adminCreateUser.get("/:id/activity-summary", ...superAdminOnly, userActivitySummary);

export default adminCreateUser;
