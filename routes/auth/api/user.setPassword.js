import express from "express";
import bcrypt from "bcrypt";
import Auth from "../../../models/auth.js";
import { body, validationResult } from "express-validator";

const setRegisterRouter = express.Router();

// Custom email validator for company emails
const validateCompanyEmail = (email) => {
  const companyEmailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}$/;
  const freeEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "protonmail.com",
    "icloud.com",
    "mail.com",
  ];

  if (!companyEmailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  const domain = email.split("@")[1];
  if (freeEmailDomains.includes(domain)) {
    throw new Error("Personal email addresses are not allowed");
  }

  return true;
};

// Validation rules
const validateAuth = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .custom(validateCompanyEmail),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
  body("name").notEmpty().withMessage("Name is required"),
  body("company").notEmpty().withMessage("Company name is required"),
  body("role")
    .optional()
    .isIn(["seller", "user", "superadmin"])
    .withMessage("Invalid role specified"),
];

// Registration endpoint
setRegisterRouter.post("/register", validateAuth, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const {
      email,
      password,
      name,
      company,
      address,
      role = "user",
      vat_number,
      industry,
    } = req.body;

    // Check if user already exists
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
        field: "email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new auth record
    const newAuth = new Auth({
      email,
      password: hashedPassword,
      name,
      company,
      address,
      role,
      vat_number,
      industry,
    });

    await newAuth.save();

    // Prepare response without sensitive data
    const userResponse = {
      id: newAuth._id,
      email: newAuth.email,
      name: newAuth.name,
      company: newAuth.company,
      role: newAuth.role,
      createdAt: newAuth.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error",
        field: Object.keys(error.keyPattern)[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Login endpoint
// authRouter.post(
//   "/login",
//   [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           status: false,
//           message: "Validation failed",
//           errors: errors.array(),
//         });
//       }

//       const { email, password } = req.body;

//       // Find user in Auth collection only
//       const user = await Auth.findOne({ email });
//       if (!user) {
//         return res.status(401).json({
//           status: false,
//           message: "Invalid credentials",
//         });
//       }

//       // Verify password
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(401).json({
//           status: false,
//           message: "Invalid credentials",
//         });
//       }

//       // Generate JWT token
//       const token = jwt.sign(
//         {
//           id: user._id,
//           email: user.email,
//           role: user.role,
//           company: user.company,
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1d" }
//       );

//       // Set secure HTTP-only cookie
//       res.cookie("authToken", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 24 * 60 * 60 * 1000, // 1 day
//       });

//       // Prepare user data for response
//       const userData = {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         company: user.company,
//         role: user.role,
//       };

//       return res.json({
//         status: true,
//         message: "Login successful",
//         user: userData,
//       });
//     } catch (error) {
//       console.error("Login error:", error);
//       return res.status(500).json({
//         status: false,
//         message: "Internal server error",
//       });
//     }
//   }
// );

export default setRegisterRouter;
