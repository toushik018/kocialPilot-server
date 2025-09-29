import express from 'express';
import auth from '../../middlewares/auth';
import { RecentDeleteController } from './recent-delete.controller';

const router = express.Router();

// Recent delete routes (kept identical paths)
router.get('/', auth(), RecentDeleteController.getRecentlyDeletedPosts);

router.patch('/:id/restore', auth(), RecentDeleteController.restorePost);

router.delete(
  '/:id/permanent',
  auth(),
  RecentDeleteController.permanentlyDeletePost
);

router.patch(
  '/restore-multiple',
  auth(),
  RecentDeleteController.restoreMultiplePosts
);

router.delete(
  '/permanent-multiple',
  auth(),
  RecentDeleteController.permanentlyDeleteMultiplePosts
);

export const RecentDeleteRoutes = router;
