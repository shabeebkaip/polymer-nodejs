import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: false },


});

const ChemicalFamily = mongoose.model("chemicalFamily", schema);
export default ChemicalFamily ;
