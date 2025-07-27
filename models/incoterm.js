import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String },
      ger: { type: String },
      cn: { type: String }
    },
    fullForm: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
      ger: { type: String, required: true },
      cn: { type: String, required: true }
    }
  },
  { timestamps: true }
);

const Incoterm = mongoose.model("incoterm", schema);
export default Incoterm;
