import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
const uploadSignature = express.Router();

uploadSignature.get('', (req, res) => {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        upload_preset: process.env.CLOUDINARY_PRESET_NAME
    }, process.env.CLOUDINARY_API_SECRET);

    res.status(200).json({ timestamp, signature });
})

export default uploadSignature