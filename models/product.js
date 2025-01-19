import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  brand: { type: Schema.Types.ObjectId, ref: "Brand", required: false },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  subCategory: [
    {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: false,
    },
  ],
  documents: [
    {
      type: String,
      required: false,
    },
  ],
  description: { type: String, required: true },
  image: { type: String, required: false },
  stock: { type: Number, required: true },
  uom: { type: String, required: true },
  price: { type: Number, required: true },
  basic_details: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
  chemical_name: { type: String, required: false },
  CAS_number: { type: String, required: false },
  product_family: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
  identification: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
  features: [
    {
      title: { type: String, required: false },
      value: { type: String, required: false },
    },
  ],
});

const Product = mongoose.model("Product", schema);

export default Product;
