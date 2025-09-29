import express from 'express';
import auth from '../../middlewares/auth';
import { DraftsController } from './drafts.controller';

const router = express.Router();

router.get('/', DraftsController.getDraftPosts);
router.delete('/', auth(), DraftsController.deleteMultipleDraftPosts);
router.delete('/:id', auth(), DraftsController.deleteSingleDraftPost);

export const DraftsRoutes = router;
