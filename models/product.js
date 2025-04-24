import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    // Basic Info
    name: { type: String, required: true }, // Name of the product
    description: { type: String, required: false }, // Product description
    image: { type: String, required: false }, // Image URL
    uom: { type: String, required: true }, // Unit of Measure
    stock: { type: Number, required: false }, // Available stock
    price: { type: Number, required: false }, // Price
    minimum_order_quantity: { type: Number, required: false }, // Minimum order quantity
    safety_data_sheet: { type: String, required: false }, // Safety Data Sheet URL
    technical_data_sheet: { type: String, required: false }, // Technical Data Sheet URL
    min_purity: { type: Number, required: false }, // Minimum purity percentage

    // References
    brand: { type: Schema.Types.ObjectId, ref: "Brand" }, // Reference to Brand
    createdBy: { type: Schema.Types.ObjectId, ref: "Auth", required: true }, // Created by

    // Multi-references
    industry: [
      { type: Schema.Types.ObjectId, ref: "Industry", required: true }, // Linked industries
    ],
    appearance: [{ type: Schema.Types.ObjectId, ref: "Appearance" }],
    substance: [
      { type: Schema.Types.ObjectId, ref: "Substance" }, // Chemical substances
    ],
    grade: [
      { type: Schema.Types.ObjectId, ref: "Grade" }, // Grades (e.g., industrial, food)
    ],
    incoterms: [
      { type: Schema.Types.ObjectId, ref: "Incoterms" }, // Trade incoterms
    ],
    product_family: [
      { type: Schema.Types.ObjectId, ref: "productFamily" }, // Product family classification
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
