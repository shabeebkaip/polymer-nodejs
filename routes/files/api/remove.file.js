import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'

const removeFile = express.Router();

dotenv.config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


removeFile.delete('/', async (req, res) => {
    const { public_id    } = req.body; 
    if (!public_id    ) {
        return res.status(400).json({ error: "Public ID is required to delete image" });
    }
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        if (result.result === 'ok') {
            res.status(200).json({ message: "Image deleted successfully" });
        } else {
            res.status(500).json({ error: "Failed to delete image" });
        }
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        res.status(500).json({ error: "Failed to delete image" });
    }
});


export default removeFile
