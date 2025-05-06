import Joi from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Auth from "../models/auth.js";
import { SIGN_OPTION } from "../tools/constant.js";

const authJoi = Joi.object().keys({
  email: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
});

export const validate = (req, res, next) => {
  const result = authJoi.validate(req.body);
  if (result.error) {
    return res.status(400).send({ message: result.error.message, code: 1 });
  } else {
    next();
  }
};

export const verify = async (req, res, next) => {
  // console.log(req.body.email);
  const auth = await Auth.findOne({
    email: req.body.email.toLowerCase().trim(),
  });
  if (!auth) {
    return res.status(404).send({ message: "Invalid Email.", code: 2 });
  }
  req.body.auth = auth;
  next();
};

export const authenticate = async (req, res, next) => {
  const result = await bcrypt.compare(
    req.body.password,
    req.body.auth.password
  );
  if (result) {
    next();
  } else {
    return res.status(401).send({ message: "Invalid Password.", code: 3 });
  }
};

export const createJwt = (req, res, next) => {
  try {
    
    const auth = req.body.auth;
    const payload = {
      id: auth._id,
      email: auth.email,
      // name: auth.name,
      // role: auth.role,
  
    };
    const token = jwt.sign(payload, process.env.JWT_KEY, SIGN_OPTION());

    if (!token) {
      throw new Error("Token generation failed");
    }

    req.body.token = token;
    res.setHeader("Authorization", `Bearer ${token}`);

    next();
  } catch (error) {
    console.error("Token generation error:", error);
    return res.status(500).send({
      message: "Token generation failed",
      code: 4,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
        code: 401,
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Fetch user from database to ensure they still exist
    const user = await Auth.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        code: 401,
      });
    }

    // Attach complete user object to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      // Add any other user properties you need
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);

    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: 401,
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: 401,
      });
    }

    res.status(500).json({
      success: false,
      message: "Authentication failed",
      code: 500,
    });
  }
};
