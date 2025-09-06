import express from 'express';
import { SocialMediaController } from './social-media.controller';

const router = express.Router();

router.post('/accounts', SocialMediaController.createAccount);

router.get('/accounts', SocialMediaController.getAllAccounts);

router.get('/accounts/:id', SocialMediaController.getAccountById);

router.patch('/accounts/:id', SocialMediaController.updateAccount);

router.delete('/accounts/:id', SocialMediaController.deleteAccount);

export const SocialMediaRoutes = router;
