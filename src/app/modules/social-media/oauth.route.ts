import { Router } from 'express';
import auth from '../../middlewares/auth';
import { OAuthController } from './oauth.controller';

const router = Router();

// Facebook OAuth routes
router.get('/facebook', auth('user', 'admin'), OAuthController.facebookAuth);
router.get('/facebook/callback', OAuthController.facebookCallback);

// Instagram OAuth routes
router.get('/instagram', auth('user', 'admin'), OAuthController.instagramAuth);
router.get('/instagram/callback', OAuthController.instagramCallback);

// Twitter OAuth routes
router.get('/twitter', auth('user', 'admin'), OAuthController.twitterAuth);
router.get('/twitter/callback', OAuthController.twitterCallback);

// LinkedIn OAuth routes
router.get('/linkedin', auth('user', 'admin'), OAuthController.linkedinAuth);
router.get('/linkedin/callback', OAuthController.linkedinCallback);

// Account management routes
router.get('/accounts', auth('user', 'admin'), OAuthController.getConnectedAccounts);
router.delete(
  '/accounts/:accountId',
  auth('user', 'admin'),
  OAuthController.disconnectAccount
);

export { router as OAuthRoutes };