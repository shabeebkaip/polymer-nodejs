import mongoose, { Schema } from "mongoose";

const supplierOfferSchema = new Schema(
  {
    bulkOrderId: {
      type: Schema.Types.ObjectId,
      ref: "BulkOrder",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
    deliveryTimeInDays: {
      type: Number,
      required: true,
    },
    incotermAndPackaging: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SupplierOfferRequest", supplierOfferSchema);
