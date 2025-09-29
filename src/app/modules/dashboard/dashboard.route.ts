import express from 'express';
import { DashboardController } from './dashboard.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get('/stats', auth(), DashboardController.getStats);

export const DashboardRoutes = router;
