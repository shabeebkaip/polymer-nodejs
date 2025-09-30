import express from 'express';
import User from '../../../models/user.js';
import { verifyOtp } from '../../../utils/otpHelper.js';
import { createJwt } from '../../../middlewares/login.auth.js';

const verifyRegistrationOtp = express.Router();

verifyRegistrationOtp.post("/", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
      });
    }

    // Verify OTP
    const otpResult = await verifyOtp(email, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({
        status: false,
        message: otpResult.message,
      });
    }

    // Find the user and update verification status
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Update user verification status
    user.verification = user.user_type === "superAdmin" ? "approved" : "verified";
    user.emailVerified = true;
    await user.save();

    // Generate JWT token for the user
    req.body.auth = { email };
    createJwt(req, res, () => {
      const userInfo = user.toObject();
      delete userInfo.createdAt;
      delete userInfo.updatedAt;
      delete userInfo.__v;

      res.status(200).json({
        status: true,
        message: "Email verified successfully! Registration completed.",
        userInfo,
        token: req.body.token,
      });
    });

  } catch (error) {
    console.error("Error verifying registration OTP:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred during email verification.",
      error: error.message,
    });
  }
});

export default verifyRegistrationOtp;
