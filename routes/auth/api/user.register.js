import express from "express";
import bcrypt from "bcrypt";
import User from "../../../models/user.js";
import Auth from "../../../models/auth.js";
import { createJwt } from "../../../middlewares/login.auth.js";
import { generateOtp, saveOtp } from "../../../utils/otpHelper.js";
import { sendRegistrationOtp } from "../../../tools/mail.js";

const userRegister = express.Router();

// Free email domain validation disabled for development
// const freeEmailDomains = new Set([
//   "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
//   "icloud.com", "aol.com", "zoho.com", "protonmail.com", "mail.com"
// ]);

// const isCompanyEmail = (email) => {
//   const domain = email.split("@")[1]?.toLowerCase();
//   return domain && !freeEmailDomains.has(domain);
// };

userRegister.post("/register", async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      company,
      email,
      password,
      website,
      phone,
      country_code,
      industry,
      address,
      location,
      vat_number,
      company_logo,
      user_type,
    } = req.body;

    email = email?.toLowerCase();

    if (!firstName || !lastName || !email || !password || !phone || !country_code) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: firstName, lastName, email, password, phone, country_code",
      });
    }

    // Company email validation disabled for development
    // if (!isCompanyEmail(email)) {
    //   return res.status(400).json({
    //     status: false,
    //     message: "Please use a company email address",
    //   });
    // }

    const existingUser = await User.findOne({ email });
    const existingAuth = await Auth.findOne({ email });

    if (existingUser || existingAuth) {
      return res.status(400).json({
        status: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      company,
      email,
      website,
      industry,
      address,
      country_code,
      phone,
      location,
      vat_number: user_type === "seller" ? vat_number : undefined,
      company_logo: user_type === "seller" ? company_logo : undefined,
      user_type,
      verification: "pending" // User needs to verify email first
    });

    await newUser.save();

    const newAuth = new Auth({
      email,
      password: hashedPassword,
    });

    await newAuth.save();

    // Generate and send OTP for email verification
    const otp = generateOtp();
    const otpSaved = await saveOtp(email, otp);

    if (!otpSaved) {
      // Clean up created user and auth if OTP saving fails
      await User.deleteOne({ email });
      await Auth.deleteOne({ email });
      return res.status(500).json({
        status: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    // Send OTP via email
    const emailResult = await sendRegistrationOtp(firstName, email, otp);
    
    if (!emailResult.success) {
      // Clean up created user and auth if email sending fails
      await User.deleteOne({ email });
      await Auth.deleteOne({ email });
      return res.status(500).json({
        status: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    // Return success response without JWT token (user needs to verify email first)
    res.status(201).json({
      status: true,
      message: "Registration successful! Please check your email for verification code.",
      data: {
        email,
        firstName,
        lastName,
        company,
        requiresVerification: true
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default userRegister;
