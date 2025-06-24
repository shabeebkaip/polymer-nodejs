import express from "express";
import User from "../../../models/user.js";
import { authenticateUser, authorizeRoles } from "../../../middlewares/verify.token.js";

const adminGetUsers = express.Router();

adminGetUsers.get(
  "/",
  authenticateUser,
  authorizeRoles("superAdmin"),
  async (req, res) => {
    try {
      // Get only superAdmin users for the seller dropdown
      const users = await User.find(
        { 
          user_type: "superAdmin", // Only superAdmin users
          verification: "approved" // Only approved users
        },
        {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          company: 1,
          user_type: 1
        }
      ).sort({ firstName: 1, lastName: 1 });

      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        users: users,
      });
    } catch (err) {
      console.error("Get Users Error:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
  }
);

export default adminGetUsers;