const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Upload media from buffer, preserving extension for raw files
exports.uploadMediaFromBuffer = (fileBuffer, resourceType = 'auto', folder = 'media', originalname = '') => {
  return new Promise((resolve, reject) => {
    // Always pass through resource_type from caller (default 'auto').
    // Keep folder structure; avoid forcing raw-specific public_id so Cloudinary can manage versions and URLs consistently.
    const uploadOptions = {
      resource_type: resourceType || 'auto',
      folder,
      // Force public, unsigned delivery (exposed via res.cloudinary.com)
      type: 'upload',
      access_mode: 'public',
      filename_override: originalname || undefined,
      use_filename: !!originalname,
      unique_filename: true,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.deleteMedia = async (publicId, resourceType = 'image') => {
  // resourceType: 'image', 'video' (Cloudinary treats audio as 'video')
  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

exports.cloudinary = cloudinary;