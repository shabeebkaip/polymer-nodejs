import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  ar_name: {
    type: String,
    required: true
  },
  ar_description: {
    type: String,
    required: true
  },
  ger_name: {
    type: String,
    required: true
  },
  ger_description: {
    type: String,
    required: true
  },
  cn_name: {
    type: String,
    required: true
  },
  cn_description: {
    type: String,
    required: true
  },
  bg: { type: String, required: false },
  icon: { type: String, required: false },
});

const Industry = mongoose.model("Industry", schema);
export default Industry;
