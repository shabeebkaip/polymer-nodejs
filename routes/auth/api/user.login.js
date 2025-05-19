import express from 'express';
import { authenticate, createJwt, validate, verify } from '../../../middlewares/login.auth.js';
import User from '../../../models/user.js';

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

    // console.log(user);
    

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