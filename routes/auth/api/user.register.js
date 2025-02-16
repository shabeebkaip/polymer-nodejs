import express from "express";
import User from "../../../models/user.js";

const userRegister = express.Router();

userRegister.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }],
    });

    if (existingUser) {
      let errorMessage = "";
      if (existingUser.email === req.body.email) {
        errorMessage = "Email already exists";
      }
      return res.status(400).json({
        message: errorMessage,
      });
    }
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      dob: req.body.dob,
      country: req.body.country || "",
      isSeller: req.body.isSeller || false,
    });

    await newUser.save();
    res.status(201).json({
      status: true,
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default userRegister;
