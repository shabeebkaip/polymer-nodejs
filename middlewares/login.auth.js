import Joi from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Auth from "../models/auth.js";
import { SIGN_OPTION } from "../tools/constant.js";

const authJoi = Joi.object().keys({
  email: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
});

export const validate = (req, res, next) => {
  const result = authJoi.validate(req.body);
  if (result.error) {
    return res.status(400).send({ message: result.error.message, code: 1 });
  } else {
    next();
  }
};

export const verify = async (req, res, next) => {
  const auth = await Auth.findOne({
    email: req.body.email.toLowerCase().trim(),
  });
  if (!auth) {
    return res.status(404).send({ message: "Invalid Email.", code: 2 });
  }
  req.body.auth = auth;
  next();
};

export const authenticate = async (req, res, next) => {
  const result = await bcrypt.compare(
    req.body.password,
    req.body.auth.password
  );
  if (result) {
    next();
  } else {
    return res.status(401).send({ message: "Invalid Password.", code: 3 });
  }
};

export const createJwt = (req, res, next) => {
  console.log(req.body);
  const token = jwt.sign(
    {
      id: req.body.auth._id, // Use MongoDB _id instead of email
      email: req.body.email, // Include email as well
    },
    process.env.JWT_KEY,
    SIGN_OPTION()
  );
  if (token) {
    req.body.token = token;
    next();
  } else {
    return res
      .status(500)
      .send({ message: "Token generation failed.", code: 4 });
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.body.userId = decoded.id; // Set userId as _id from JWT
    req.body.email = decoded.email; // Optional: keep email too
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
