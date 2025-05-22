import express from 'express';
import bcrypt from "bcrypt";
import Auth from '../../../models/auth.js';
import { authenticateUser } from '../../../middlewares/verify.token.js';

const changePassword = express.Router();

changePassword.post('', authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Both current and new passwords are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const userEmail = req.user.email;

    const authRecord = await Auth.findOne({ email: userEmail });

    if (!authRecord) {
      return res.status(404).json({
        status: false,
        message: 'Authentication record not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, authRecord.password);

    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await Auth.updateOne({ email: userEmail }, { password: hashedPassword });

    return res.status(200).json({
      status: true,
      message: 'Password has been successfully changed.',
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error.',
    });
  }
});

export default changePassword;
