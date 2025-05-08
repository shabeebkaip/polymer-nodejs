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
    streetName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: Number,
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
    samplePrice: {
      type: String
    },
    forFree: {
      type: Boolean
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
      enum: ["pending", "approved", "rejected", "fulfilled"],
      default: "pending",
    },

  },
  { timestamps: true }
);

const SampleRequest = mongoose.model("SampleRequest", sampleRequestSchema);
export default SampleRequest;
