import express from 'express';
import { SocialMediaController } from './social-media.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/accounts', auth(), SocialMediaController.createAccount);

router.get('/accounts', auth(), SocialMediaController.getAllAccounts);

router.get('/accounts/:id', auth(), SocialMediaController.getAccountById);

router.patch('/accounts/:id', auth(), SocialMediaController.updateAccount);

router.delete('/accounts/:id', auth(), SocialMediaController.deleteAccount);

export const SocialMediaRoutes = router;
