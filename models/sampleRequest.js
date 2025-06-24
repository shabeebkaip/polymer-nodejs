import mongoose from "mongoose";

const sampleRequestSchema = new mongoose.Schema(
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
    phone: {
      type: Number,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
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
    orderDate: {
      type: Date,
    },
    neededBy: {
      type: Date,
    },
    message: {
      type: String,
      trim: true,
    },
    request_document: {
      type: String
    },
    // purchase_plan: {
    //   type: String,
    //   required: true,
    //   enum: ["immediate", "3_months", "6_months", "1_year", "testing"],
    // },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "responded"],
      default: "pending",
    },

  },
  { timestamps: true }
);

const SampleRequest = mongoose.model("SampleRequest", sampleRequestSchema);
export default SampleRequest;
