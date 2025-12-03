import mongoose, { Schema } from "mongoose";

const dealQuoteRequestSchema = new Schema(
  {
    // References
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    bestDealId: {
      type: Schema.Types.ObjectId,
      ref: "BestDeal",
      required: true,
      index: true,
    },

    // Request details
    message: {
      type: String,
      required: false,
      trim: true,
    },
    desiredQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    shippingCountry: {
      type: String,
      required: true,
      trim: true,
    },
    paymentTerms: {
      type: String,
      required: false,
      trim: true,
    },
    deliveryDeadline: {
      type: Date,
      required: false,
    },

    adminNote: {
      type: String,
      trim: true,
    },

    // Status history (current status is the last entry)
    status: [
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
        updatedBy: {
          type: String,
          default: "seller",
          enum: ["seller", "admin", "buyer"],
        },
      },
    ],

    // Seller response
    sellerResponse: {
      message: { type: String, trim: true },
      quotedPrice: { type: Number },
      quotedQuantity: { type: Number },
      estimatedDelivery: { type: Date },
      respondedAt: { type: Date },
      quotationDocument: {
        id: { type: String },
        name: { type: String },
        type: { type: String },
        fileUrl: { type: String },
        viewUrl: { type: String },
        uploadedAt: { type: Date },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for current status value
dealQuoteRequestSchema.virtual('currentStatus').get(function() {
  if (this.status && this.status.length > 0) {
    return this.status[this.status.length - 1].status;
  }
  return 'pending';
});

// Ensure virtuals are included in JSON
dealQuoteRequestSchema.set('toJSON', { virtuals: true });
dealQuoteRequestSchema.set('toObject', { virtuals: true });

// Indexes for performance
dealQuoteRequestSchema.index({ buyerId: 1, createdAt: -1 });
dealQuoteRequestSchema.index({ sellerId: 1, createdAt: -1 });
dealQuoteRequestSchema.index({ bestDealId: 1, createdAt: -1 });
dealQuoteRequestSchema.index({ 'status.status': 1, createdAt: -1 });

const DealQuoteRequest = mongoose.model(
  "DealQuoteRequest",
  dealQuoteRequestSchema
);

export default DealQuoteRequest;