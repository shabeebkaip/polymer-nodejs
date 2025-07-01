import express from 'express';
import bcrypt from 'bcrypt';
import User from '../../../models/user.js';
import Otp from '../../../models/otp.js';

const verifyOtp = express.Router();

verifyOtp.post("/", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP or OTP has expired.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        status: false,
        message: "OTP has expired.",
      });
    }

    const isOtpValid = await bcrypt.compare(String(otp), otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP.",
      });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

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

export default verifyOtp;
