import mongoose from "mongoose";
import { Schema } from "mongoose";

const shippingMethodSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, 
    },
    description: {
      type: String,
      required: false, 
      trim: true,
    },
    ar_name: { 
      type: String, 
      required: true,
      trim: true,
    },
    ar_description:{
      type: String,
      required: false, 
      trim: true,
    },
    ger_name: { 
      type: String, 
      required: true,
      trim: true,
    },
    ger_description:{
      type: String,
      required: false, 
      trim: true,
    },
    cn_name: { 
      type: String, 
      required: true,
      trim: true,
    },
    cn_description:{
      type: String,
      required: false, 
      trim: true,
    },
  },
  { 
    timestamps: true 
  }
);

const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);
export default ShippingMethod;
