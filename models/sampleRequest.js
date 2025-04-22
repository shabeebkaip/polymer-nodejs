import mongoose from "mongoose";

const sampleRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  purchase_plan: {
    type: String,
    required: true,
    enum: ["immediate", "3_months", "6_months", "1_year", "testing"], // example values
  },
  application: {
    type: String,
    required: true,
    trim: true,
  },
  expected_annual_volume: {
    type: Number,
    required: true,
    min: 0,
  },
  industry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Industry",
    required: true,
  },
  uom: {
    type: String,
    required: true,
    enum: [
      "Kilogram",
      "Gram",
      "Milligram",
      "Metric Ton",
      "Pound",
      "Ounce",
      "Liter",
      "Milliliter",
      "Cubic Meter",
      "Cubic Centimeter",
      "Gallon",
      "Quart",
      "Pint",
    ], // example units
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "fulfilled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SampleRequest = mongoose.model("SampleRequest", sampleRequestSchema);
export default SampleRequest;
