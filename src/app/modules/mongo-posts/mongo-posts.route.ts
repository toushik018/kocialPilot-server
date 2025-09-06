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

// Get optimal schedule time
router.get(
  '/optimal-schedule-time',
  MongoPostController.getOptimalScheduleTime
);

// Reschedule a post
router.put('/:id/reschedule', auth(), MongoPostController.reschedulePost);

// Schedule multiple draft posts
router.post('/schedule-drafts', auth(), MongoPostController.scheduleDraftPosts);

// Schedule single draft post
router.post(
  '/schedule-single/:id',
  auth(),
  MongoPostController.scheduleSingleDraftPost
);

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

router.delete('/:id', MongoPostController.deletePost);

export const MongoPostRoutes = router;
