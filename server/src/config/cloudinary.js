const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'chatapp/files';
    let resource_type = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'chatapp/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'chatapp/audio';
      resource_type = 'video'; // Cloudinary uses 'video' for audio too
    }

    return {
      folder,
      resource_type,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'webm', 'pdf', 'doc', 'docx', 'txt', 'zip'],
      transformation: file.mimetype.startsWith('image/') ? [{ quality: 'auto', fetch_format: 'auto' }] : undefined,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/zip',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

module.exports = { upload, cloudinary };
