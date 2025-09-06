import { Router } from 'express';
import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

// Public routes
router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser
);

router.post('/logout', AuthController.logoutUser);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.get('/profile', auth('user', 'admin'), AuthController.getProfile);

router.patch(
  '/profile',
  auth('user', 'admin'),
  validateRequest(AuthValidation.updateProfileValidationSchema),
  AuthController.updateProfile
);

router.patch(
  '/change-password',
  auth('user', 'admin'),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  '/social-accounts',
  auth('user', 'admin'),
  validateRequest(AuthValidation.socialAccountValidationSchema),
  AuthController.addSocialAccount
);

router.delete(
  '/social-accounts/:platform/:accountId',
  auth('user', 'admin'),
  AuthController.removeSocialAccount
);

export const AuthRoute = router;
