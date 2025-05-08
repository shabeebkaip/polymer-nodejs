import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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
      ],
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "grade",
    },
    incoterm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "incoterm",
    },
    postCode: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    packagingType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "packagingType",
    },
    packaging_size: {
      type: String,
      required: true,
    },
    expected_annual_volume: {
      type: Number,
      min: 0,
    },
    delivery_date: {
      type: Date,
      required: true
    },
    application: {
      type: String,
      trim: true,
    },
    pricing: {
      type: String,
    },
    message: {
      type: String,
      trim: true,
    },
    request_document: {
      type: String
    },
    open_request:{
      type: Boolean
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "fulfilled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const QuoteRequest = mongoose.model("QuoteRequest", schema);
export default QuoteRequest;
