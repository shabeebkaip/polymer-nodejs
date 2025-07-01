
import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  emiMonths: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  estimatedPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  // ✅ Added Fields
  productGrade: {
    type: String
  },
  desiredDeliveryDate: {
    type: Date
  },
  destination: {
    type: String
  },
  paymentTerms: {
    type: String
  },
  requireLogisticsSupport: {
    type: String, // or Boolean
    enum: ["Yes", "No"]
  },
  previousPurchaseHistory: {
    type: String
  },
  additionalNotes: {
    type: String
  },
  country: {
    type: String
  }
}, { timestamps: true });

const Finance = mongoose.model('finance', schema);
export default Finance;
