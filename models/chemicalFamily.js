import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: false },


});

const ChemicalFamily = mongoose.model("Chemical Family", schema);
export default ChemicalFamily ;
