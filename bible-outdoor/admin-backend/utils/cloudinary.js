const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary config in use:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY
});

// Upload media from buffer, preserving extension for raw files
exports.uploadMediaFromBuffer = (fileBuffer, resourceType = 'auto', folder = 'media', originalname = '') => {
  return new Promise((resolve, reject) => {
    let uploadOptions = {
      resource_type: resourceType,
    };

    // For raw uploads (PDF, DOC, etc.), preserve the original extension
    if (resourceType === 'raw' && originalname) {
      const ext = path.extname(originalname); // e.g., '.pdf'
      let base = path.basename(originalname, ext);
      // Sanitize base name: replace spaces with underscores and remove non-alphanumeric characters
      base = base.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      // For raw files, we construct the full public_id including the folder path.
      // This is more explicit and avoids potential issues with how the SDK combines folder and public_id.
      uploadOptions.public_id = `${folder}/${base}${ext}`;
    } else {
      // For other resource types, just use the folder option as before.
      uploadOptions.folder = folder;
    }

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