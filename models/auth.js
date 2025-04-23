import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
    },
    industry: {
      type: Schema.Types.ObjectId,
      ref: "Industry",
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    vat_number: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["seller", "user", "superadmin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const Auth = mongoose.model("auth", schema);
export default Auth;
