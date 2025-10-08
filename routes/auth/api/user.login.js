import express from 'express';
import { authenticate, createJwt, validate, verify } from '../../../middlewares/login.auth.js';
import User from '../../../models/user.js';
import { isDemoUser } from '../../../config/demoUsers.js';

const userLogin = express.Router()

userLogin.post('/login', validate, verify, authenticate, createJwt, async (req,res) => {
    try {
      const email = req.body.email?.toLowerCase();
      const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Check if email is verified for non-admin and non-demo users
    const isDemo = isDemoUser(email);
    if (user.user_type !== "superAdmin" && !user.emailVerified && !isDemo) {
      return res.status(403).json({
        status: false,
        message: "Please verify your email before logging in",
        requiresEmailVerification: true,
        email: email
      });
    }

    // Auto-verify demo users if not already verified
    if (isDemo && !user.emailVerified) {
      user.emailVerified = true;
      user.verification = 'verified';
      await user.save();
      console.log(`✅ Auto-verified demo user: ${email}`);
    }

    res.status(200).json({
      status: true,
      message: "Login Success",
      userInfo: user,
      token: req.body.token,
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default userLogin;