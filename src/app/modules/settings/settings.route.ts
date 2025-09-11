import express from 'express';
import auth from '../../middlewares/auth';
import { SettingsController } from './settings.controller';

const router = express.Router();

// All settings routes require authentication
// General settings routes
router.get('/', auth('user', 'admin'), SettingsController.getUserSettings);
router.patch('/', auth('user', 'admin'), SettingsController.updateUserSettings);
router.post(
  '/reset',
  auth('user', 'admin'),
  SettingsController.resetUserSettings
);

// Specific settings categories
router.patch(
  '/notifications',
  auth('user', 'admin'),
  SettingsController.updateNotificationSettings
);
router.patch(
  '/privacy',
  auth('user', 'admin'),
  SettingsController.updatePrivacySettings
);
router.patch(
  '/security',
  auth('user', 'admin'),
  SettingsController.updateSecuritySettings
);

// Account management
router.post(
  '/export',
  auth('user', 'admin'),
  SettingsController.exportUserData
);
router.delete(
  '/account',
  auth('user', 'admin'),
  SettingsController.deleteUserAccount
);

export const SettingsRoutes = router;
