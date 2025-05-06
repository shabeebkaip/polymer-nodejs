import jwt from "jsonwebtoken";
import Auth from "../models/auth.js";
import User from "../models/user.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.body.email = decoded.id;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const auth = await Auth.findOne({ email: decoded.email });

    if (!auth) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: auth record not found",
      });
    }

    const user = await User.findOne({ email: auth.email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found",
      });
    }

    req.user = {
      id: user._id,
      email: auth.email,
      name: `${user.firstName} ${user.lastName}`,
      company:user.company,
      website: user.website,
      phone: user.phone,
      user_type: user.user_type,
      createdAt: user.createdAt,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.user_type}) is not allowed to access this resource`,
      });
    }
    next();
  };
};
