import mongoose, { Schema } from "mongoose";

const quoteRequestSchema = new Schema(
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
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
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
    uom: {
      type: String,
      required: false,
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
    shippingCountry: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: false,
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
    
    // Additional product-specific fields
    gradeId: {
      type: Schema.Types.ObjectId,
      ref: "grade",
      required: false,
    },
    incotermId: {
      type: Schema.Types.ObjectId,
      ref: "incoterm",
      required: false,
    },
    packagingTypeId: {
      type: Schema.Types.ObjectId,
      ref: "packagingType",
      required: false,
    },
    packagingSize: {
      type: String,
      required: false,
    },
    expectedAnnualVolume: {
      type: Number,
      min: 0,
    },
    application: {
      type: String,
      trim: true,
    },
    requestDocument: {
      id: { type: String },
      name: { type: String },
      type: { type: String },
      fileUrl: { type: String },
      viewUrl: { type: String },
      uploadedAt: { type: Date },
    },
    openRequest: {
      type: Boolean,
      default: false,
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
            "pending",        // Initial state - waiting for seller
            "responded",      // Seller provided quotation
            "accepted",       // Buyer accepted, proceed to order
            "rejected",       // Seller rejected the request
            "cancelled"       // Buyer cancelled
          ],
        },
        message: {
          type: String,
          required: false,
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
      leadTime: { type: String },
      terms: { type: String },
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
quoteRequestSchema.virtual('currentStatus').get(function() {
  if (this.status && this.status.length > 0) {
    return this.status[this.status.length - 1].status;
  }
  return 'pending';
});

// Ensure virtuals are included in JSON
quoteRequestSchema.set('toJSON', { virtuals: true });
quoteRequestSchema.set('toObject', { virtuals: true });

// Indexes for performance
quoteRequestSchema.index({ buyerId: 1, createdAt: -1 });
quoteRequestSchema.index({ sellerId: 1, createdAt: -1 });
quoteRequestSchema.index({ productId: 1, createdAt: -1 });
quoteRequestSchema.index({ 'status.status': 1, createdAt: -1 });

const QuoteRequest = mongoose.model("QuoteRequest", quoteRequestSchema);
export default QuoteRequest;
