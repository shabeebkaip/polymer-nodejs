import mongoose from "mongoose";
const { Schema } = mongoose;

const bulkOrderSchema = new Schema(
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
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    delivery_date: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
    },
    request_document: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Seller status tracking
    sellerStatus: {
      type: String,
      enum: [
        "pending", // Waiting for seller response
        "accepted", // Seller accepted the bulk order
        "in_progress", // Order is being processed
        "shipped", // Order has been shipped
        "delivered", // Order has been delivered
        "completed", // Order completed successfully
        "cancelled", // Order was cancelled
        "rejected", // Seller rejected the order
      ],
      default: "pending",
    },
    // Response messages from seller to buyer
    statusMessage: [
      {
        status: {
          type: String,
          required: true,
          enum: [
            "pending",
            "accepted",
            "in_progress",
            "shipped",
            "delivered",
            "completed",
            "cancelled",
            "rejected",
          ],
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

const BulkOrder = mongoose.model("BulkOrder", bulkOrderSchema);
export default BulkOrder;
