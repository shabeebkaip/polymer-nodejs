import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    fullForm: {
      type: String,
      required: true
    },
    ar_name: {
      type: String,
      required: true
    },
    ar_fullForm: {
      type: String,
      required: true
    },
    ger_name: {
      type: String,
      required: true
    },
    ger_fullForm: {
      type: String,
      required: true
    },
    cn_name: {
      type: String,
      required: true
    },
    cn_fullForm: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

const Incoterm = mongoose.model("incoterm", schema);
export default Incoterm;
