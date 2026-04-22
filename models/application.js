import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true },
    ar_name: { type: String, default: "" },
    ger_name: { type: String, default: "" },
    cn_name: { type: String, default: "" },
  },
  { timestamps: true }
);

const Application = mongoose.model("application", schema);
export default Application;
