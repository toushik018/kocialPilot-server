import express from 'express';
import auth from '../../middlewares/auth';
import { upload } from '../../middlewares/multer';
import { AIController } from './ai.controller';

const router = express.Router();

// POST: Upload a single image with caption
// Note: This route will be prefixed with '/api/v1/ai' from routes/index.ts
// The full endpoint will be: /api/v1/ai/images/upload-single-with-caption
router.post(
  '/images/upload-single-with-caption',
  auth(),
  upload.single('file'),
  AIController.uploadImageWithCaption
);

// Export the router
export const AIRoutes = router;
