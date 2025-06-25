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
      type: String,
    },
    status: {
      type: String,
      enum: [
        "pending", // Request created by buyer, waiting for supplier action
        "responded", // Supplier responded/request acknowledged
        "sent", // Sample sent by supplier
        "delivered", // Sample received by buyer
        "approved", // Buyer approved sample
        "rejected", // Rejected by supplier or buyer
        "cancelled", // Request cancelled by buyer or supplier
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

const SampleRequest = mongoose.model("SampleRequest", sampleRequestSchema);
export default SampleRequest;
