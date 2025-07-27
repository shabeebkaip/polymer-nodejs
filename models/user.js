import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  profile_image: {
    type: String
  },
  company: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  country_code: {
    type: String,
    required: true
  },
  phone: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
  },
  vat_number: {
    type: String,
  },
  company_logo: {
    type: String
  },
  user_type: {
    type: String,
    enum: ["buyer", "seller", "superAdmin", "expert"],
    default: "buyer",
  },
  about_us: {
    type: String
  },
  Expert_department: {
    type: String
  },
  Expert_role: {
    type: String
  },
  verification: {
    type: String,
    default: "pending"
  },
  premium_partner : {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("user", schema);
export default User;