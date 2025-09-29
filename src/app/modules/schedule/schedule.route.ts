import express from 'express';
import { ScheduleController } from './schedule.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Create a new schedule
router.post('/', auth(), ScheduleController.createSchedule);

// Get user's active schedule
router.get('/active', auth(), ScheduleController.getUserSchedule);

// Get all user's schedules
router.get('/all', auth(), ScheduleController.getAllUserSchedules);

// Update a schedule
router.patch('/:id', auth(), ScheduleController.updateSchedule);

// Delete a schedule
router.delete('/:id', auth(), ScheduleController.deleteSchedule);

// Post scheduling related (moved from mongo-posts)
router.get(
  '/optimal-schedule-time',
  auth(),
  ScheduleController.getOptimalScheduleTime
);

router.patch('/:id/reschedule', auth(), ScheduleController.reschedulePost);

router.post('/schedule-drafts', auth(), ScheduleController.scheduleDraftPosts);

router.post(
  '/schedule-single/:id',
  auth(),
  ScheduleController.scheduleSingleDraftPost
);

export const ScheduleRoutes = router;
