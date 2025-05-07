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
      streetName: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
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
      phone: {
        type: Number,
      },
      purchase_plan: {
        type: String,
        required: true,
        enum: ["immediate", "3_months", "6_months", "1_year", "testing"],
      },
      grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "grade",
      },
      application: {
        type: String,
        trim: true,
      },
      expected_annual_volume: {
        type: Number,
        min: 0,
      },
      industry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Industry",
      },
      orderDate: {
        type: Date,
      },
      neededBy: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "fulfilled"],
        default: "pending",
      },
      message: {
        type: String,
        trim: true,
      },
     
    },
    { timestamps: true }
  );

const QuoteRequest = mongoose.model("QuoteRequest", schema);
export default QuoteRequest;
