import { Router } from 'express';
import auth from '../../middlewares/auth';
import { OAuthController } from './oauth.controller';

const router = Router();

// Facebook OAuth routes
router.get('/facebook', auth('user'), OAuthController.facebookAuth);
router.get('/facebook/callback', OAuthController.facebookCallback);

// Instagram OAuth routes
router.get('/instagram', auth('user'), OAuthController.instagramAuth);
router.get('/instagram/callback', OAuthController.instagramCallback);

// Twitter OAuth routes
router.get('/twitter', auth('user'), OAuthController.twitterAuth);
router.get('/twitter/callback', OAuthController.twitterCallback);

// LinkedIn OAuth routes
router.get('/linkedin', auth('user'), OAuthController.linkedinAuth);
router.get('/linkedin/callback', OAuthController.linkedinCallback);

// Account management routes
router.get('/accounts', auth('user'), OAuthController.getConnectedAccounts);
router.delete('/accounts/:accountId', auth('user'), OAuthController.disconnectAccount);

export { router as OAuthRoutes };