import express from "express";
import {
  authenticate,
  createJwt,
  validate,
  verify,
} from "../../../middlewares/login.auth.js";

const adminLogin = express.Router();

adminLogin.post(
  "/login",
  validate,
  verify,
  authenticate,
  createJwt,
  async (req, res) => {
    try {
      // Get user details from the auth object (set by verify middleware)
      const user = req.body.auth;

      // Remove sensitive data from req.body
      delete req.body.password;

      // Respond with user details and token
      res.status(200).json({
        status: true,
        message: "Login Success.",
        token: req.body.token,
        user: {
          id: req.body?.auth?._id, // MongoDB _id
          username: req?.body?.email, // Assuming username exists in Auth schema
          email: user.email, // Assuming type field exists; default to "user" if not
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Unable to verify the credentials." });
    }
  }
);

export default adminLogin;
