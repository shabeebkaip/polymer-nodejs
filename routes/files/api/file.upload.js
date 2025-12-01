import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Readable } from 'stream';

const fileUpload = express.Router();
dotenv.config();

let cachedFetch = null;
const getFetch = async () => {
  if (typeof fetch === 'function') {
    return fetch;
  }
  if (!cachedFetch) {
    const module = await import('node-fetch');
    cachedFetch = module.default;
  }
  return cachedFetch;
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract file extension from filename
 */
const getFileExtension = (filename) => {
  const match = filename?.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Determine Cloudinary resource type based on mimetype
 */
const getResourceType = (mimetype) => {
  const type = mimetype?.split('/')[0];
  return type === 'image' ? 'image' : 'raw';
};

const extensionMimeMap = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  rtf: 'application/rtf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

const resolveMimeType = (extension, resourceType, upstreamContentType) => {
  if (upstreamContentType && upstreamContentType !== 'application/octet-stream') {
    return upstreamContentType;
  }
  if (extension && extensionMimeMap[extension]) {
    return extensionMimeMap[extension];
  }
  return resourceType === 'image' ? 'image/jpeg' : 'application/pdf';
};

/**
 * Build proper Cloudinary URL with viewing support for PDFs
 */
const buildFileUrl = (result, resourceType) => {
  // For raw files, Cloudinary forces download by default
  // We need to use the authenticated/signed URL or accept the download behavior
  // The fl_attachment flag doesn't work in the URL path for raw resource type
  return result.secure_url || result.url;
};

/**
 * Upload file to Cloudinary
 */
fileUpload.post('/', async (req, res) => {
  try {
    // Validate file exists
    const file = req.files?.file;
    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: "No file uploaded" 
      });
    }

    console.log('📤 Uploading:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

    // Extract file details
    const extension = getFileExtension(file.name);
    const resourceType = getResourceType(file.mimetype);
    
    // Generate clean filename without extension for public_id
    const cleanFilename = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const publicId = `polymer/${cleanFilename}_${timestamp}`;

    // Upload to Cloudinary
    console.log('⬆️  Uploading to Cloudinary with:', { 
      resourceType, 
      publicId,
      filePath: file.tempFilePath || file.path 
    });

    const uploadOptions = {
      resource_type: resourceType,
      public_id: publicId,
      overwrite: false,
    };

    // For raw files (PDFs), set flags to allow inline display
    if (resourceType === 'raw') {
      uploadOptions.flags = 'attachment:false';
    }

    const result = await cloudinary.uploader.upload(
      file.tempFilePath || file.path,
      uploadOptions
    );

    console.log('📦 Cloudinary result:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      version: result.version
    });

    // Determine final format (prefer Cloudinary's format, fallback to extracted)
    const format = result.format || extension || 'bin';

    // Use Cloudinary's secure URL directly
    const fileUrl = buildFileUrl(result, resourceType);
    
    // For download, use the same URL (browser handles it based on content-type)
    const downloadUrl = fileUrl;

    // Internal viewer endpoint for inline rendering
    const viewUrl = `/api/files/view/${encodeURIComponent(result.public_id)}?resourceType=${resourceType}`;

    // Prepare response
    const response = {
      fileUrl,
      downloadUrl,
      viewUrl,
      id: result.public_id,
      originalFilename: file.name,
      format,
      resourceType: result.resource_type,
    };

    console.log('✅ Final response:', response);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload file',
      details: error.message 
    });
  }
});

/**
 * Stream files through API to force inline disposition
 */
export const streamFile = async (req, res) => {
  try {
    const encodedId = req.params.publicId ?? req.params[0];
    const publicId = encodedId ? decodeURIComponent(encodedId) : null;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Missing file identifier',
      });
    }

    const requestedType = req.query.resourceType === 'image' ? 'image' : 'raw';

    // Fetch metadata to retrieve the correct URL and filename
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: requestedType,
    });

    const sourceUrl = resource?.secure_url || resource?.url;
    if (!sourceUrl) {
      throw new Error('Cloudinary did not return a URL for this resource');
    }

    const fetchImpl = await getFetch();
    const upstreamResponse = await fetchImpl(sourceUrl);
    if (!upstreamResponse.ok) {
      throw new Error(`Cloudinary responded with status ${upstreamResponse.status}`);
    }

    const upstreamContentType = upstreamResponse.headers.get('content-type');
    const baseName = resource.original_filename || publicId.split('/').pop() || 'file';
    const extension = (resource.format || getFileExtension(baseName) || '').toLowerCase();
    const contentType = resolveMimeType(extension, requestedType, upstreamContentType);
    const printableName = extension && !baseName.endsWith(`.${extension}`)
      ? `${baseName}.${extension}`
      : baseName;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${printableName}"`);
    const lengthHeader = upstreamResponse.headers.get('content-length') || resource.bytes;
    if (lengthHeader) {
      res.setHeader('Content-Length', lengthHeader);
    }

    const upstreamBody = upstreamResponse.body;

    if (!upstreamBody) {
      throw new Error('Cloudinary response did not include a body to stream');
    }

    if (typeof upstreamBody.pipe === 'function') {
      upstreamBody.pipe(res);
    } else {
      Readable.fromWeb(upstreamBody).pipe(res);
    }

  } catch (error) {
    console.error('❌ File view failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Unable to stream requested file',
      details: error.message,
    });
  }
};

fileUpload.get('/view/*', streamFile);

export default fileUpload;
