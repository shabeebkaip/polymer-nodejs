import mongoose, { Schema } from "mongoose";

const unifiedQuoteRequestSchema = new Schema(
  {
    // Common fields for both types
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    
    // Discriminator field to identify the type
    requestType: {
      type: String,
      enum: ["product_quote", "deal_quote"],
      required: true,
    },
    
    // For product quote requests
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: function() {
        return this.requestType === "product_quote";
      },
    },
    
    // For deal quote requests
    bestDealId: {
      type: Schema.Types.ObjectId,
      ref: "BestDeal",
      required: function() {
        return this.requestType === "deal_quote";
      },
    },
    
    // Common quantity fields
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    
    // For product quotes - more specific name
    desiredQuantity: {
      type: Number,
      required: function() {
        return this.requestType === "deal_quote";
      },
    },
    
    uom: {
      type: String,
      required: function() {
        return this.requestType === "product_quote";
      },
      enum: [
        "Kilogram", "Gram", "Milligram", "Metric Ton", "Pound", "Ounce",
        "Liter", "Milliliter", "Cubic Meter", "Cubic Centimeter", 
        "Gallon", "Quart", "Pint"
      ],
    },
    
    // Location fields
    country: {
      type: String,
      required: function() {
        return this.requestType === "product_quote";
      },
    },
    
    shippingCountry: {
      type: String,
      required: function() {
        return this.requestType === "deal_quote";
      },
    },
    
    destination: {
      type: String,
      required: function() {
        return this.requestType === "product_quote";
      },
    },
    
    // Payment and delivery
    paymentTerms: {
      type: String,
      required: function() {
        return this.requestType === "deal_quote";
      },
    },
    
    delivery_date: {
      type: Date,
      required: function() {
        return this.requestType === "product_quote";
      },
    },
    
    deliveryDeadline: {
      type: Date,
      required: function() {
        return this.requestType === "deal_quote";
      },
    },
    
    // Optional fields for product quotes
    grade: {
      type: Schema.Types.ObjectId,
      ref: "grade",
    },
    
    incoterm: {
      type: Schema.Types.ObjectId,
      ref: "incoterm",
    },
    
    packagingType: {
      type: Schema.Types.ObjectId,
      ref: "packagingType",
    },
    
    packaging_size: {
      type: String,
    },
    
    expected_annual_volume: {
      type: Number,
      min: 0,
    },
    
    application: {
      type: String,
      trim: true,
    },
    
    price: {
      type: String,
    },
    
    lead_time: {
      type: String,
      trim: true,
    },
    
    terms: {
      type: String,
      trim: true,
    },
    
    // Common message field
    message: {
      type: String,
      trim: true,
    },
    
    request_document: {
      type: String,
    },
    
    open_request: {
      type: Boolean,
      default: false,
    },
    
    // Unified status system
    status: {
      type: String,
      enum: [
        "pending",        // Initial request submitted
        "responded",      // Supplier responded with quote
        "negotiation",    // Under negotiation
        "accepted",       // Quote accepted by buyer
        "in_progress",    // Deal being processed
        "shipped",        // Order shipped
        "delivered",      // Order delivered
        "completed",      // Successfully completed
        "rejected",       // Rejected by supplier or buyer
        "cancelled",      // Cancelled by buyer
      ],
      default: "pending",
    },
    
    adminNote: {
      type: String,
    },
    
    // Enhanced status tracking
    statusMessage: [
      {
        status: {
          type: String,
          required: true,
          enum: [
            "pending", "responded", "negotiation", "accepted",
            "in_progress", "shipped", "delivered", "completed",
            "rejected", "cancelled"
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
          default: "buyer",
          enum: ["buyer", "seller", "admin"],
        },
      },
    ],
    
    // Metadata for tracking source
    sourceSection: {
      type: String,
      enum: ["product_detail", "special_offers", "search_results"],
      default: "product_detail",
    },
  },
  { 
    timestamps: true,
    // Add discriminator key for easier querying
    discriminatorKey: 'requestType'
  }
);

// Virtual to get unified delivery date
unifiedQuoteRequestSchema.virtual('unifiedDeliveryDate').get(function() {
  return this.delivery_date || this.deliveryDeadline;
});

// Virtual to get unified shipping location
unifiedQuoteRequestSchema.virtual('unifiedShippingLocation').get(function() {
  return this.country || this.shippingCountry;
});

// Virtual to get unified quantity
unifiedQuoteRequestSchema.virtual('unifiedQuantity').get(function() {
  return this.quantity || this.desiredQuantity;
});

// Index for efficient filtering
unifiedQuoteRequestSchema.index({ requestType: 1, status: 1, buyerId: 1 });
unifiedQuoteRequestSchema.index({ createdAt: -1 });

const UnifiedQuoteRequest = mongoose.model("UnifiedQuoteRequest", unifiedQuoteRequestSchema);
export default UnifiedQuoteRequest;
