import express from 'express';
import auth from '../../middlewares/auth';
import { OAuthController } from './oauth.controller';

const router = express.Router();

// Facebook OAuth routes
router.get('/facebook/auth', OAuthController.getFacebookAuthUrl);
router.get('/facebook/callback', OAuthController.handleFacebookCallback);

// Instagram OAuth routes
router.get('/instagram/auth', OAuthController.getInstagramAuthUrl);
router.get(
  '/instagram/callback',
  auth('user'),
  OAuthController.handleInstagramCallback
);

// Twitter OAuth routes
router.get('/twitter/auth', OAuthController.getTwitterAuthUrl);
router.get(
  '/twitter/callback',
  auth('user'),
  OAuthController.handleTwitterCallback
);

// LinkedIn OAuth routes
router.get('/linkedin/auth', OAuthController.getLinkedInAuthUrl);
router.get(
  '/linkedin/callback',
  auth('user'),
  OAuthController.handleLinkedInCallback
);

export const OAuthRoutes = router;
