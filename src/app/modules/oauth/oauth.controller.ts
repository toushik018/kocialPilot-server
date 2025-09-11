import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { OAuthService } from './oauth.service';
import { SocialMediaService } from '../social-media/social-media.service';
import config from '../../config';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
  };
}

// Facebook OAuth
const getFacebookAuthUrl = catchAsync(async (req: Request, res: Response) => {
  const authUrl = OAuthService.getFacebookAuthUrl();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Facebook auth URL generated successfully',
    data: { authUrl },
  });
});

const handleFacebookCallback = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { code } = req.query;
    const userId = req.user?.userId || req.user?.id;

    if (!code || !userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code and user ID are required',
      });
    }

    const tokenData = await OAuthService.exchangeFacebookCode(code as string);
    const profile = await OAuthService.getFacebookProfile(
      tokenData.access_token
    );

    // Save to database
    await SocialMediaService.createAccount({
      platform: 'facebook',
      accountName: profile.name || 'Facebook Account',
      accountId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      isConnected: true,
      owner: new Types.ObjectId(userId),
    });

    // Redirect to frontend with success
    res.redirect(`${config.frontend_url}/settings?connected=facebook`);
  }
);

// Instagram OAuth
const getInstagramAuthUrl = catchAsync(async (req: Request, res: Response) => {
  const authUrl = OAuthService.getInstagramAuthUrl();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Instagram auth URL generated successfully',
    data: { authUrl },
  });
});

const handleInstagramCallback = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { code } = req.query;
    const userId = req.user?.userId || req.user?.id;

    if (!code || !userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code and user ID are required',
      });
    }

    const tokenData = await OAuthService.exchangeInstagramCode(code as string);
    const profile = await OAuthService.getInstagramProfile(
      tokenData.access_token
    );

    // Save to database
    await SocialMediaService.createAccount({
      platform: 'instagram',
      accountName: profile.name || 'Instagram Account',
      accountId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      isConnected: true,
      owner: new Types.ObjectId(userId),
    });

    // Redirect to frontend with success
    res.redirect(`${config.frontend_url}/settings?connected=instagram`);
  }
);

// Twitter OAuth
const getTwitterAuthUrl = catchAsync(async (req: Request, res: Response) => {
  const authUrl = OAuthService.getTwitterAuthUrl();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Twitter auth URL generated successfully',
    data: { authUrl },
  });
});

const handleTwitterCallback = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { code } = req.query;
    const userId = req.user?.userId || req.user?.id;

    if (!code || !userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code and user ID are required',
      });
    }

    const tokenData = await OAuthService.exchangeTwitterCode(code as string);
    const profile = await OAuthService.getTwitterProfile(
      tokenData.access_token
    );

    // Save to database
    await SocialMediaService.createAccount({
      platform: 'twitter',
      accountName: profile.name || 'Twitter Account',
      accountId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      isConnected: true,
      owner: new Types.ObjectId(userId),
    });

    // Redirect to frontend with success
    res.redirect(`${config.frontend_url}/settings?connected=twitter`);
  }
);

// LinkedIn OAuth
const getLinkedInAuthUrl = catchAsync(async (req: Request, res: Response) => {
  const authUrl = OAuthService.getLinkedInAuthUrl();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'LinkedIn auth URL generated successfully',
    data: { authUrl },
  });
});

const handleLinkedInCallback = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { code } = req.query;
    const userId = req.user?.userId || req.user?.id;

    if (!code || !userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code and user ID are required',
      });
    }

    const tokenData = await OAuthService.exchangeLinkedInCode(code as string);
    const profile = await OAuthService.getLinkedInProfile(
      tokenData.access_token
    );

    // Save to database
    await SocialMediaService.createAccount({
      platform: 'linkedin',
      accountName: profile.name || 'LinkedIn Account',
      accountId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      isConnected: true,
      owner: new Types.ObjectId(userId),
    });

    // Redirect to frontend with success
    res.redirect(`${config.frontend_url}/settings?connected=linkedin`);
  }
);

export const OAuthController = {
  getFacebookAuthUrl,
  handleFacebookCallback,
  getInstagramAuthUrl,
  handleInstagramCallback,
  getTwitterAuthUrl,
  handleTwitterCallback,
  getLinkedInAuthUrl,
  handleLinkedInCallback,
};
