import mongoose, { Schema } from "mongoose"; 
 
const schema = new Schema( 
  { 
    buyerId: { 
      type: Schema.Types.ObjectId, 
      ref: "user", 
      required: true 
    }, 
    bestDealId: { 
      type: Schema.Types.ObjectId, 
      ref: "BestDeal", 
      required: true 
    }, 
    desiredQuantity: { 
      type: Number, 
      required: true 
    }, 
    shippingCountry: { 
      type: String, 
      required: true 
    }, 
    paymentTerms: { 
      type: String, 
      required: true 
    }, 
    deliveryDeadline: { 
      type: Date, 
      required: true 
    }, 
    message: { 
      type: String 
    }, 
    status: { 
      type: String, 
      enum: [
        "pending", // Waiting for seller response
        "accepted", // Seller accepted the deal quote
        "in_progress", // Deal is being processed
        "shipped", // Deal has been shipped
        "delivered", // Deal has been delivered
        "completed", // Deal completed successfully
        "cancelled", // Deal was cancelled
        "rejected", // Seller rejected the deal
      ], 
      default: "pending" 
    }, 
    adminNote: { 
      type: String 
    },
    // Status messages tracking all updates from seller
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
        updatedBy: {
          type: String,
          default: "seller",
          enum: ["seller", "admin"]
        }
      },
    ],
  }, 
  { timestamps: true } 
); 
 
 
const DealQuoteRequest = mongoose.model("dealQuoteRequest", schema); 
export default DealQuoteRequest;