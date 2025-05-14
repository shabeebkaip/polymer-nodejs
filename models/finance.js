import mongoose from "mongoose";
import { Schema } from "mongoose";

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
        default: "pending",
      },
}, { timestamps: true });

const Finance = mongoose.model('finance', schema);
export default Finance;
