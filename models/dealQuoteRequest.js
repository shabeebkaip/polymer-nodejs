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
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    adminNote: {
      type: String
    }
  },
  { timestamps: true }
);


const DealQuoteRequest = mongoose.model("dealQuoteRequest", schema);
export default DealQuoteRequest ;
