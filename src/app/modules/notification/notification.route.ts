import express from 'express';
import { notificationController } from './notification.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../auth/auth.constant';

const router = express.Router();

// Create a new notification (admin only)
router.post(
  '/',
  auth(USER_ROLE.admin),
  notificationController.createNotification
);

// Get notifications for authenticated user
router.get(
  '/',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.getNotifications
);

// Get notification statistics
router.get(
  '/stats',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.getNotificationStats
);

// Get unread notification count
router.get(
  '/unread-count',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.getUnreadCount
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.markAllAsRead
);

// Bulk update notifications
router.patch(
  '/bulk-update',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.bulkUpdateNotifications
);

// Get a single notification by ID
router.get(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.getNotificationById
);

// Update a notification
router.patch(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.updateNotification
);

// Mark a notification as read
router.patch(
  '/:id/read',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.markAsRead
);

// Delete a notification
router.delete(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.admin),
  notificationController.deleteNotification
);

export const NotificationRoutes = router;
