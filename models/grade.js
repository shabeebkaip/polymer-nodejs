import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description:{
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

const Grade = mongoose.model("grade", schema);
export default Grade;
