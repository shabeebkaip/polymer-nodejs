import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  supplier: { type: String, required: true },
  identification: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
  features: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
  applications: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
  logo: { type: String, required: false },
  cover: { type: String, required: false },
  mail: { type: String, required: false },
  phone: { type: String, required: false },
  website: { type: String, required: false },
  linkedIn: { type: String, required: false },
});

const Brand = mongoose.model("Brand", schema);

export default Brand;
