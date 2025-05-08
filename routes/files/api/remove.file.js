import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

const removeFile = express.Router();
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

removeFile.delete('/', async (req, res) => {
  const { public_id } = req.body; 

  if (!public_id) {
    return res.status(400).json({ error: "Public ID is required to delete file" });
  }

  try {
  
    let result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok') {
      result = await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' });
    }

    if (result.result === 'ok') {
      res.status(200).json({ message: "File deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete file", result });
    }
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default removeFile;
