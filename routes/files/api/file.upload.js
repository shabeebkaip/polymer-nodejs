import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

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
    const fileExt = file.mimetype.split('/')[1];
    let resourceType;
    if (["image", "video", "audio"].includes(fileType)) {
      resourceType = fileType === "audio" ? "video" : fileType; // Cloudinary treats audio as video
    } else {
      resourceType = "raw";
    }

    const uploadOptions = {
      folder: 'polymer',
      resource_type: resourceType,
    };
    // Set filename_override if available
    if (file.name) {
      uploadOptions.filename_override = file.name;
      uploadOptions.use_filename = true;
      uploadOptions.unique_filename = false; // To keep the filename as is
    }

    const result = await cloudinary.uploader.upload(
      file.tempFilePath || file.path,
      uploadOptions
    );


    let fileUrl = result.secure_url || result.url;
    // Remove PDF transformation logic; just return the direct Cloudinary URL
    // For PDF preview, use an <iframe> or PDF viewer in the frontend with this URL

    // Always use the original file name with extension from the upload if available
    let originalFilename = file.name || result.original_filename;
    // If the filename does not already end with the extension, append it
    if (result.format) {
      const ext = '.' + result.format.toLowerCase();
      if (!originalFilename.toLowerCase().endsWith(ext)) {
        originalFilename += ext;
      }
    }

    res.status(200).json({
      fileUrl,
      id: result.public_id,
      originalFilename,
      format: result.format,
      resourceType: result.resource_type,
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default fileUpload;
