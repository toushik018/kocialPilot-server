import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Profile management routes
router.get('/profile/:userId', auth(), UserController.getUserProfile);
router.patch('/profile/:userId', auth(), UserController.updateProfile);

// Password management
router.patch('/password/:userId', auth(), UserController.changePassword);

// User statistics and activity
router.get('/stats/:userId', auth(), UserController.getUserStats);
router.get('/activity/:userId', auth(), UserController.getUserActivity);

// Session tracking
router.post('/logout/:userId', auth(), UserController.trackLogout);

export const UserRoutes = router;
