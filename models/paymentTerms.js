import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const PaymentTerms = mongoose.model("paymentTerms", schema);
export default PaymentTerms;
