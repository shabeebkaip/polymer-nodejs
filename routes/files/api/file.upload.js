import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import mime from 'mime-types';

const fileUpload = express.Router();
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

fileUpload.post('/', async (req, res) => {
  const file = req.files?.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {

    const fileType = file.mimetype.split('/')[0];


    const result = await cloudinary.uploader.upload(
      file.tempFilePath || file.path,
      {
        folder: 'polymer',
       resource_type: fileType === 'video' ? 'video' : fileType === 'audio' ? 'video' : 'image',
      }
    );


    res.status(200).json({
      fileUrl: result.secure_url,
      id: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default fileUpload;
