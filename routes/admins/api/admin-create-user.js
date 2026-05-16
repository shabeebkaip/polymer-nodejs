import express from "express";
import bcrypt from "bcrypt";
import User from "../../../models/user.js";
import Auth from "../../../models/auth.js";
import { sendAccountCreationEmail } from "../../../services/email.service.js";
import generateRandomId from "../../../common/random.js";

const adminCreateUser = express.Router();

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

    if (!firstName || !lastName || !email || !phone || !country_code || !user_type) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: firstName, lastName, email, phone, country_code, user_type",
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
      phone,
      country_code,
      user_type,
      company,
      website,
      location,
      address,
      industry,
      vat_number: user_type === "seller" ? vat_number : undefined,
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

export default adminCreateUser;
