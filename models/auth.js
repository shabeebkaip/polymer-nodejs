import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["seller", "user", "superadmin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: true,
  },
});

const Auth = mongoose.model("auth", schema);
export default Auth;
