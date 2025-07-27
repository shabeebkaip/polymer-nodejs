import mongoose from "mongoose";
import { Schema } from "mongoose";

const shippingMethodSchema = new Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
      ger: { type: String, required: true, trim: true },
      cn: { type: String, required: true, trim: true }
    },
    description: {
      en: { type: String, required: false, trim: true },
      ar: { type: String, required: false, trim: true },
      ger: { type: String, required: false, trim: true },
      cn: { type: String, required: false, trim: true }
    }
  },
  { 
    timestamps: true 
  }
);

const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);
export default ShippingMethod;
