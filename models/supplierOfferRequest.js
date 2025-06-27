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

    // Buyer status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: {
      type: String,
    },

    // ✅ New: Timeline of all status updates (by buyer or admin)
    statusMessage: [
      {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: String,
          enum: ["buyer", "admin"],
          default: "buyer",
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SupplierOfferRequest", supplierOfferSchema);
