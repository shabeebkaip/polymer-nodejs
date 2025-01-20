import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: false },
});

const productFamily = mongoose.model("Product Family", schema);
export default productFamily;
