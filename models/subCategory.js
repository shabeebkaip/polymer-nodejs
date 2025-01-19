import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: false },
  icon: { type: String, required: false },
  parentCategory: { type: String, required: true },
  // parentCategory: { type: Schema.Types.ObjectId, ref: "Category" },
});

const SubCategory = mongoose.model("SubCategory", schema);
export default SubCategory;
