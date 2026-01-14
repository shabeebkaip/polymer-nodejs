import express from "express";
import earlyAccessService from "../../../services/earlyAccess.service.js";

const submitEarlyAccessRouter = express.Router();

submitEarlyAccessRouter.post("/", async (req, res) => {
  try {
    const { email, userType } = req.body;

    // Validation
    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email and user type are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate user type
    if (!["buyer", "supplier"].includes(userType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "User type must be either 'buyer' or 'supplier'",
      });
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");

    const result = await earlyAccessService.submitRequest({
      email: email.toLowerCase().trim(),
      userType: userType.toLowerCase(),
      ipAddress,
      userAgent,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error in early access submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit early access request. Please try again.",
    });
  }
});

export default submitEarlyAccessRouter;
