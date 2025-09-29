import express from 'express';
import auth from '../../middlewares/auth';
import { upload } from '../../middlewares/multer';
import { MongoPostController } from './mongo-posts.controller';

const router = express.Router();

// Create post endpoints (both for compatibility)
router.post('/', auth(), MongoPostController.createPost);
router.post('/create', auth(), MongoPostController.createPost);

// Image upload endpoint with multer middleware
router.post(
  '/upload-image',
  auth(),
  upload.single('image'),
  MongoPostController.uploadImagePost
);

// Scheduling routes moved to schedule module

// Get posts by specific date
router.get('/by-date/:date', MongoPostController.getPostsByDate);

// Calendar routes
router.get('/calendar/:year/:month', MongoPostController.getCalendarPosts);

router.get('/all', MongoPostController.getAllPosts);

router.get('/drafts', MongoPostController.getDraftPosts);

// Delete multiple draft posts
router.delete('/drafts', auth(), MongoPostController.deleteMultipleDraftPosts);

// Delete single draft post
router.delete('/drafts/:id', auth(), MongoPostController.deleteSingleDraftPost);

router.get('/:id', MongoPostController.getPostById);

router.patch('/:id', MongoPostController.updatePost);

router.delete('/:id', auth(), MongoPostController.deletePost);

export const MongoPostRoutes = router;
