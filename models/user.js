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
  company: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  website:{
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
  phone:{
    type:Number,
    required:true,
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
  user_type:{
    type: String,
    enum:["buyer", "seller"],
    default: "buyer",
  },
  verification: {
    type: String,
    default: "pending"
  }
});

const User = mongoose.model("user", schema);
export default User;