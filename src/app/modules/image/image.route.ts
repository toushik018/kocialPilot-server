import express from 'express';
import { ImageController } from './image.controller';
import { upload } from '../../middlewares/multer';
import auth from '../../middlewares/auth';

const router = express.Router();

// Routes
router.post(
  '/upload',
  auth(),
  upload.single('image'),
  ImageController.uploadImage
);

router.get('/', auth(), ImageController.getAllImages);
router.get('/:id', auth(), ImageController.getImageById);
router.delete('/:id', auth(), ImageController.deleteImage);

export const ImageRoutes = router;
