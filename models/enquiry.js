import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  custumerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: { type: String, required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: false },
  uom: { type: String, required: false },
  quantity: { type: Number, required: false },
});

const Enquiry = mongoose.model("Enquiry", schema);

export default Enquiry;
