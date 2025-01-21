import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
    name: {
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
    isSeller: {
        type: Boolean,
        default: false
    },
    

})

const User = mongoose.model('user', schema);
export default User