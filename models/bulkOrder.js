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
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const BulkOrder = mongoose.model("BulkOrder", bulkOrderSchema);
export default BulkOrder;
