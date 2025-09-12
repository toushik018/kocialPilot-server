import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import config from '../../config';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { SocialMediaService } from '../social-media/social-media.service';
import { OAuthService } from './oauth.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
  };
}

// Facebook OAuth
const getFacebookAuthUrl = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User must be logged in to connect social media',
      });
    }

    const authUrl = OAuthService.getFacebookAuthUrl(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Facebook auth URL generated successfully',
      data: { authUrl },
    });
  }
);

const handleFacebookCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Extract user ID from state if provided
    let userId: string | undefined;
    if (state && typeof state === 'string') {
      const stateParts = state.split(':');
      if (stateParts.length > 1) {
        userId = stateParts[1];
      }
    }

    const tokenData = await OAuthService.exchangeFacebookCode(code as string);
    const profile = await OAuthService.getFacebookProfile(
      tokenData.access_token
    );

    if (!userId) {
      // Redirect to frontend with tokens for manual association
      res.redirect(
        `${config.frontend_url}/oauth-callback?platform=facebook&access_token=${tokenData.access_token}&profile=${encodeURIComponent(JSON.stringify(profile))}`
      );
      return;
    }

    // Save to database if we have user ID
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
const getInstagramAuthUrl = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User must be logged in to connect social media',
      });
    }

    const authUrl = OAuthService.getInstagramAuthUrl(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Instagram auth URL generated successfully',
      data: { authUrl },
    });
  }
);

const handleInstagramCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Extract user ID from state if provided
    let userId: string | undefined;
    if (state && typeof state === 'string') {
      const stateParts = state.split(':');
      if (stateParts.length > 1) {
        userId = stateParts[1];
      }
    }

    if (!userId) {
      res.redirect(`${config.frontend_url}/settings?error=user_not_identified`);
      return;
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
const getTwitterAuthUrl = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User must be logged in to connect social media',
      });
    }

    const authUrl = OAuthService.getTwitterAuthUrl(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Twitter auth URL generated successfully',
      data: { authUrl },
    });
  }
);

const handleTwitterCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Extract user ID from state if provided
    let userId: string | undefined;
    if (state && typeof state === 'string') {
      const stateParts = state.split(':');
      if (stateParts.length > 1) {
        userId = stateParts[1];
      }
    }

    if (!userId) {
      res.redirect(`${config.frontend_url}/settings?error=user_not_identified`);
      return;
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
const getLinkedInAuthUrl = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User must be logged in to connect social media',
      });
    }

    const authUrl = OAuthService.getLinkedInAuthUrl(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'LinkedIn auth URL generated successfully',
      data: { authUrl },
    });
  }
);

const handleLinkedInCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Extract user ID from state if provided
    let userId: string | undefined;
    if (state && typeof state === 'string') {
      const stateParts = state.split(':');
      if (stateParts.length > 1) {
        userId = stateParts[1];
      }
    }

    if (!userId) {
      res.redirect(`${config.frontend_url}/settings?error=user_not_identified`);
      return;
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
