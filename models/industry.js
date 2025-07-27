import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: {
    en: { type: String, required: true },
    ar: { type: String, required: true },
    ger: { type: String, required: true },
    cn: { type: String, required: true }
  },
  description: {
    en: { type: String, required: true },
    ar: { type: String, required: true },
    ger: { type: String, required: true },
    cn: { type: String, required: true }
  },
  bg: { type: String, required: false },
  icon: { type: String, required: false }
});

const Industry = mongoose.model("Industry", schema);
export default Industry;
