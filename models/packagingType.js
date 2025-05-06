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

const PackagingType = mongoose.model("packagingType", schema);
export default PackagingType;
