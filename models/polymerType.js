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
    },
    ar_description:{
      type: String,
    },
    ger_name: { 
      type: String, 
    },
    ger_description:{
      type: String,
    },
    cn_name: { 
      type: String, 
    },
    cn_description:{
      type: String,
    },
  },
  { timestamps: true }
);

const PolymerType = mongoose.model("polymerType", schema);
export default PolymerType;
