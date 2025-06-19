import mongoose, { Schema } from "mongoose";

const bestDealSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    offerPrice: {
      type: Number,
      required: true
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

const BestDeal = mongoose.model("BestDeal", bestDealSchema);
export default BestDeal;
