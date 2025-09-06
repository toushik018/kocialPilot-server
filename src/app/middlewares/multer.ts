import type { Request } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import config from '../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Cloudinary storage configuration
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kocial-pilot', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { quality: 'auto' }, // Automatic quality optimization
      { fetch_format: 'auto' }, // Automatic format selection
    ],
  } as CloudinaryStorage['params'],
});

// Fallback local storage (for development or backup)
const uploadDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadDir, 'images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${timestamp}-${randomString}${ext}`;
    cb(null, uniqueFilename);
  },
});

// Choose storage based on environment or configuration
const useCloudinary = process.env.NODE_ENV === 'production' || process.env.USE_CLOUDINARY === 'true';
const storage = useCloudinary ? cloudinaryStorage : localStorage;

// File filter
const fileFilter = (
  req: Request,
  file: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Export the multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Export cloudinary instance for direct use
export { cloudinary };
