import express from 'express';
import { UserController } from './user.controller';

const router = express.Router();

// Profile management routes
router.get('/profile/:userId', UserController.getUserProfile);
router.patch('/profile/:userId', UserController.updateProfile);

// Password management
router.patch('/password/:userId', UserController.changePassword);

// User statistics and activity
router.get('/stats/:userId', UserController.getUserStats);
router.get('/activity/:userId', UserController.getUserActivity);

// Session tracking
router.post('/logout/:userId', UserController.trackLogout);

export const UserRoutes = router;
