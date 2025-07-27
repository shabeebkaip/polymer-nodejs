import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
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
    }
  },
  { timestamps: true }
);

const Grade = mongoose.model("grade", schema);
export default Grade;
