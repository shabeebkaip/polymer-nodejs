import express from 'express';
import User from '../../../models/user.js';
import { verifyOtp } from '../../../utils/otpHelper.js';

const verifyOtpRouter = express.Router();

verifyOtpRouter.post("/", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
      });
    }

    // Verify OTP using helper function
    const otpResult = await verifyOtp(email, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({
        status: false,
        message: otpResult.message,
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "No user found with this email.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "OTP verified. You can now reset your password.",
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred during OTP verification.",
      error: error.message,
    });
  }
});

export default verifyOtpRouter;
