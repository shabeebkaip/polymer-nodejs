import express from 'express';
import User from '../../../models/user.js';
import { authenticateUser } from '../../../middlewares/verify.token.js';

const getUserData = express.Router();


getUserData.get('/', authenticateUser, async (req, res) => {
  try {
    const id = req.user?.id;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "User data fetched successfully",
      userInfo: user,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default getUserData;
