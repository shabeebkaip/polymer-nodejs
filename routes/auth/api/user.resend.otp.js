import express from 'express';
import User from '../../../models/user.js';
import { generateOtp, saveOtp } from '../../../utils/otpHelper.js';
import { sendRegistrationOtp } from '../../../tools/mail.js';

const resendOtp = express.Router();

resendOtp.post("/", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    // Check if user exists and is not already verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    if (user.verification === "verified" || user.verification === "approved") {
      return res.status(400).json({
        status: false,
        message: "User is already verified.",
      });
    }

    // Generate and send new OTP
    const otp = generateOtp();
    const otpSaved = await saveOtp(email, otp);

    if (!otpSaved) {
      return res.status(500).json({
        status: false,
        message: "Failed to generate OTP. Please try again.",
      });
    }

    // Send OTP via email
    const emailResult = await sendRegistrationOtp(user.firstName, email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        status: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Verification code sent successfully! Please check your email.",
    });

  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while resending OTP.",
      error: error.message,
    });
  }
});

export default resendOtp;
