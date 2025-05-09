import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true },
    fullForm:{
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

const Incoterm = mongoose.model("incoterm", schema);
export default Incoterm;
