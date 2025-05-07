import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  description:{
    type: String,
    required: true
  },
});

const ChemicalFamily = mongoose.model("chemicalFamily", schema);
export default ChemicalFamily ;
