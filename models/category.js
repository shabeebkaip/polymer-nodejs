import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: false },
  icon: { type: String, required: false },
});

const Category = mongoose.model("Category", schema);
export default Category;
