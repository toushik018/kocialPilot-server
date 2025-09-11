import express from 'express';
import { OAuthController } from './oauth.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Facebook OAuth routes
router.get('/facebook/auth', auth('user'), OAuthController.getFacebookAuthUrl);
router.get('/facebook/callback', auth('user'), OAuthController.handleFacebookCallback);

// Instagram OAuth routes
router.get('/instagram/auth', auth('user'), OAuthController.getInstagramAuthUrl);
router.get('/instagram/callback', auth('user'), OAuthController.handleInstagramCallback);

// Twitter OAuth routes
router.get('/twitter/auth', auth('user'), OAuthController.getTwitterAuthUrl);
router.get('/twitter/callback', auth('user'), OAuthController.handleTwitterCallback);

// LinkedIn OAuth routes
router.get('/linkedin/auth', auth('user'), OAuthController.getLinkedInAuthUrl);
router.get('/linkedin/callback', auth('user'), OAuthController.handleLinkedInCallback);

export const OAuthRoutes = router;