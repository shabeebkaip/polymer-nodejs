import express from "express";
import bcrypt from "bcrypt";
import User from "../../../models/user.js";
import Auth from "../../../models/auth.js";

const setPasswordRouter = express.Router();

setPasswordRouter.post("/set-password", async (req, res) => {
  try {
    const { email, password, confirmPassword, role, name } = req.body;

    // Validate required fields
    if (!email || !password || !confirmPassword || !name) {
      return res.status(400).json({
        status: false,
        message: "Email, name, password, and confirm password are required.",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Passwords do not match.",
      });
    }

    // Validate role if provided
    if (role && !["seller", "user", "superadmin"].includes(role)) {
      return res.status(400).json({
        status: false,
        message: "Invalid role. Must be one of: seller, user, superadmin",
      });
    }

    // Check if user exists in User collection
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found. Please register.",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if auth record exists
    let authUser = await Auth.findOne({ email });

    if (authUser) {
      // Update existing auth record
      authUser.password = hashedPassword;
      authUser.name = name;

      // Only update role if it's provided (don't overwrite existing role with undefined)
      if (role) {
        authUser.role = role;
      }

      await authUser.save();
      return res.status(200).json({
        status: true,
        message: "Authentication details updated successfully.",
        user: {
          email: authUser.email,
          name: authUser.name,
          role: authUser.role,
        },
      });
    } else {
      // Create new auth record
      const newAuth = new Auth({
        email,
        password: hashedPassword,
        name,
        role: role || "user", // Default to 'user' if role not provided
      });

      await newAuth.save();
      return res.status(201).json({
        status: true,
        message: "Authentication created successfully.",
        user: {
          email: newAuth.email,
          name: newAuth.name,
          role: newAuth.role,
        },
      });
    }
  } catch (error) {
    console.error("Error setting password:", error);

    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({
        status: false,
        message: "Email already exists in the authentication system.",
      });
    }

    res.status(500).json({
      status: false,
      message: "An error occurred while setting the password.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default setPasswordRouter;
