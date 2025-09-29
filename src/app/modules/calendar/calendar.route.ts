import express from 'express';
import { CalendarController } from './calendar.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Important: declare the more specific route BEFORE the param route to avoid collisions
router.get('/by-date/:date', auth(), CalendarController.getPostsByDate);
router.get('/:year/:month', auth(), CalendarController.getCalendarPosts);

export const CalendarRoutes = router;
