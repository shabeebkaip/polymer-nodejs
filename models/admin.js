import mongoose from "mongoose";
import { Schema } from "mongoose";

const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    profileUrl: {
        type: String,
    },
}, { timestamps: true });

const Admin = mongoose.model('admin', schema);
export default Admin;
