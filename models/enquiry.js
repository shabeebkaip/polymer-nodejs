import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: false },
  uom: { type: String, required: false },
  units: { type: Number, required: false },
});

const Enquiry = mongoose.model("Enquiry", schema);

export default Enquiry;
