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
    description: {
      en: { type: String },
      ar: { type: String },
      ger: { type: String },
      cn: { type: String }
    }
  },
  { timestamps: true }
);

const PhysicalForm = mongoose.model("physicalForm", schema);
export default PhysicalForm;
