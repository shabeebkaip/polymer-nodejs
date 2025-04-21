import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  country: {
    type: String,
  },
  user_type: {
    type: String,
    enum: ["seller", "user", "superadmin"],
    default: "user",
  },
});

const User = mongoose.model("user", schema);
export default User;
