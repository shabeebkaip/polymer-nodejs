import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Appearance = mongoose.model("appearance", schema);

export default Appearance;
