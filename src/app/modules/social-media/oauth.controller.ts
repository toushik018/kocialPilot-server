import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

import { OAuthService } from './oauth.service';

// Facebook OAuth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const facebookAuth = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }

  const authUrl = OAuthService.getFacebookAuthUrl(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Facebook OAuth URL generated',
    data: { authUrl },
  });
});

const facebookCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=missing_parameters`
    );
  }

  try {
    const result = await OAuthService.handleFacebookCallback(
      code as string,
      state as string
    );

    if (result.success) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?success=facebook_connected`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?error=${result.error}`
      );
    }
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=oauth_failed`
    );
  }
});

// Instagram OAuth (uses Facebook)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instagramAuth = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }

  const authUrl = OAuthService.getInstagramAuthUrl(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Instagram OAuth URL generated',
    data: { authUrl },
  });
});

const instagramCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=missing_parameters`
    );
  }

  try {
    const result = await OAuthService.handleInstagramCallback(
      code as string,
      state as string
    );

    if (result.success) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?success=instagram_connected`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?error=${result.error}`
      );
    }
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=oauth_failed`
    );
  }
});

// Twitter OAuth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const twitterAuth = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }

  const authUrl = OAuthService.getTwitterAuthUrl(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Twitter OAuth URL generated',
    data: { authUrl },
  });
});

const twitterCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=missing_parameters`
    );
  }

  try {
    const result = await OAuthService.handleTwitterCallback(
      code as string,
      state as string
    );

    if (result.success) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?success=twitter_connected`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?error=${result.error}`
      );
    }
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=oauth_failed`
    );
  }
});

// LinkedIn OAuth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linkedinAuth = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }

  const authUrl = OAuthService.getLinkedInAuthUrl(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'LinkedIn OAuth URL generated',
    data: { authUrl },
  });
});

const linkedinCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/settings?error=${error}`);
  }

  if (!code || !state) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=missing_parameters`
    );
  }

  try {
    const result = await OAuthService.handleLinkedInCallback(
      code as string,
      state as string
    );

    if (result.success) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?success=linkedin_connected`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?error=${result.error}`
      );
    }
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?error=oauth_failed`
    );
  }
});

// Get connected accounts for user
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getConnectedAccounts = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }

  const accounts = await OAuthService.getConnectedAccounts(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Connected accounts retrieved successfully',
    data: accounts,
  });
});

// Disconnect account
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const disconnectAccount = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const { accountId } = req.params;

  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await OAuthService.disconnectAccount(accountId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: result.success,
    message: result.message,
  });
});

export const OAuthController = {
  facebookAuth,
  facebookCallback,
  instagramAuth,
  instagramCallback,
  twitterAuth,
  twitterCallback,
  linkedinAuth,
  linkedinCallback,
  getConnectedAccounts,
  disconnectAccount,
};
