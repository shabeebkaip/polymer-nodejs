import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true },
    cas_number: { type: String, required: true },
  },
  { timestamps: true }
);
const Substance = mongoose.model("substance", schema);
export default Substance;
