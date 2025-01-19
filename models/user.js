import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
    first_name: {
        type: String,
        required: true,
    },
    last_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    profile_url: {
        type: String,
    },
    
    dob: {
        type: String,
        required: true
    },
    country: {
        type: String,
    },
    mobile: {
        type: Number
    },
   
         
})

const User = mongoose.model('user', schema);
export default User