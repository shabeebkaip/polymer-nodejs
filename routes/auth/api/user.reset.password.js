import express from 'express';
import bcrypt from 'bcrypt';
import Auth from '../../../models/auth.js';

const resetPassword = express.Router();

resetPassword.post('/', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const newPassword = req.body.password || req.body.newPassword;

    if (!email || !newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Email and new password are required.',
      });
    }

    const authRecord = await Auth.findOne({ email });

    if (!authRecord) {
      return res.status(404).json({
        status: false,
        message: 'No auth record found for this email.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    authRecord.password = hashedPassword;
    await authRecord.save();

    return res.status(200).json({
      status: true,
      message: 'Password reset successfully.',
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      status: false,
      message: 'An error occurred while resetting the password.',
      error: error.message,
    });
  }
});

export default resetPassword;
