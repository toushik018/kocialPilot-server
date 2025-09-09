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

// Cloudinary storage configuration for videos
const cloudinaryVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kocial-pilot/videos', // Folder name in Cloudinary
    allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
    resource_type: 'video',
    transformation: [
      { quality: 'auto' }, // Automatic quality optimization
    ],
  } as CloudinaryStorage['params'],
});

// Fallback local storage for videos
const uploadDir = path.join(process.cwd(), 'uploads');
const videosDir = path.join(uploadDir, 'videos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const localVideoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir);
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
const useCloudinary =
  process.env.NODE_ENV === 'production' ||
  process.env.USE_CLOUDINARY === 'true';
const videoStorage = useCloudinary ? cloudinaryVideoStorage : localVideoStorage;

// Video file filter
const videoFileFilter = (
  req: Request,
  file: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  cb: multer.FileFilterCallback
) => {
  // Accept videos only
  if (!file.originalname.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)) {
    return cb(new Error('Only video files are allowed!'));
  }
  cb(null, true);
};

// Export the video multer instance
export const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
});

// Export cloudinary instance for direct use
export { cloudinary };
