import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    }, ar_name: { 
      type: String, 
      required: true 
    },
    ar_description:{
      type: String,
      required: true
    },
    ger_name: { 
      type: String, 
      required: true 
    },
    ger_description:{
      type: String,
      required: true
    },
    cn_name: { 
      type: String, 
      required: true 
    },
    cn_description:{
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

const PolymerType = mongoose.model("polymerType", schema);
export default PolymerType;
