import express from 'express';
import { CleanupController } from './cleanup.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Get cleanup statistics (authenticated users)
router.get('/stats', auth(), CleanupController.getCleanupStats);

// Trigger manual cleanup (admin only)
router.post('/manual', auth('admin'), CleanupController.triggerManualCleanup);

// Run automatic cleanup (internal endpoint - no auth required for cron jobs)
router.post('/auto', CleanupController.runAutomaticCleanup);

export const CleanupRoutes = router;