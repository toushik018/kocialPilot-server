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

export const ScheduleRoutes = router;
