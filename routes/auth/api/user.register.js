import express from "express";
import bcrypt from "bcrypt";
import User from "../../../models/user.js";
import Auth from "../../../models/auth.js";
import { createJwt } from "../../../middlewares/login.auth.js";

const userRegister = express.Router();

const freeEmailDomains = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "aol.com", "zoho.com", "protonmail.com", "mail.com"
]);

const isCompanyEmail = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain && !freeEmailDomains.has(domain);
};

userRegister.post("/register", async (req, res) => {
  try {
    const { firstName,lastName,company,email,password, website,phone, industry,address,location,vat_number,company_logo,user_type } = req.body;

    if (!firstName || !lastName || !company || !email || !password || !website || !phone) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
      });
    }

    if (!isCompanyEmail(email)) {
      return res.status(400).json({
        status: false,
        message: "Please use a company email address",
      });
    }

    if (user_type === "seller" && (!vat_number || !company_logo)) {
      return res.status(400).json({
        status: false,
        message: "VAT number and company logo are required for sellers",
      });
    }

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
      phone,
      location,
      vat_number: user_type === "seller" ? vat_number : undefined,
      company_logo: user_type === "seller" ? company_logo : undefined,
      user_type,
      verification: user_type === "superAdmin" ? "approved" : undefined
    });

    await newUser.save();

    const newAuth = new Auth({
      email,
      password: hashedPassword,
    });

    await newAuth.save();

    req.body.auth = { email };

    createJwt(req, res, () => {
      const userInfo = newUser.toObject();
      res.status(201).json({
        status: true,
        message: "User registered successfully",
        userInfo,
        token: req.body.token,
      });
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
