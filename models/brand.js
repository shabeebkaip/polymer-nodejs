import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  logo: { type: String, required: false },
  cover: { type: String, required: false },
  mail: { type: String, required: false },
  phone: { type: String, required: false },
  website: { type: String, required: false },
  linkedIn: { type: String, required: false },
});

const Brand = mongoose.model("Brand", schema);

export default Brand;
