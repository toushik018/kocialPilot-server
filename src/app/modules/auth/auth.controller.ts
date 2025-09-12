import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import AppError from '../../error/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { AUTH_MESSAGES } from './auth.constant';
import { AuthRequest } from './auth.interface';
import { AuthService } from './auth.service';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.createUser(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
    statusCode: StatusCodes.CREATED,
    data: {
      user: {
        _id: result.user._id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        isEmailVerified: result.user.isEmailVerified,
        role: result.user.role,
      },
      accessToken: result.accessToken,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  console.log('Login request body:', req.body);
  const result = await AuthService.loginUser(req.body);
  const { refreshToken, accessToken, user, expiresAt } = result;

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    domain:
      config.NODE_ENV === 'production'
        ? '.kocial-pilot.vercel.app'
        : 'localhost',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
    statusCode: StatusCodes.OK,
    data: {
      accessToken,
      expiresAt,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username, // Virtual field
        name: user.name, // Virtual field
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        preferences: user.preferences,
      },
    },
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  await AuthService.logoutUser(refreshToken);

  res.clearCookie('refreshToken', {
    domain:
      config.NODE_ENV === 'production'
        ? '.kocial-pilot.vercel.app'
        : 'localhost',
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Try to get refresh token from cookie first, then from body
  const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshTokenValue) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token is required');
  }

  const result = await AuthService.refreshToken(refreshTokenValue);

  // Set new refresh token as cookie if we got one
  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      domain:
        config.NODE_ENV === 'production'
          ? '.kocial-pilot.vercel.app'
          : 'localhost',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: {
      accessToken: result.accessToken,
      ...(result.refreshToken && { refreshToken: result.refreshToken }),
      expiresAt: result.expiresAt,
    },
  });
});

const verifyToken = catchAsync<AuthRequest>(async (req: AuthRequest, res: Response) => {
  // If we reach here, the token is valid (auth middleware passed)
  const user = req.user!;

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Token is valid',
    statusCode: StatusCodes.OK,
    data: {
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      expiresAt: user.exp ? new Date(user.exp * 1000).toISOString() : null,
    },
  });
});

const getProfile = catchAsync<AuthRequest>(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const result = await AuthService.getUserProfile(userId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const updateProfile = catchAsync<AuthRequest>(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const result = await AuthService.updateUserProfile(userId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.PROFILE_UPDATE_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const changePassword = catchAsync<AuthRequest>(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  await AuthService.changePassword(userId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS,
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const addSocialAccount = catchAsync<AuthRequest>(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const result = await AuthService.addSocialAccount(userId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.SOCIAL_ACCOUNT_ADDED,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const removeSocialAccount = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { platform, accountId } = req.params;
    await AuthService.removeSocialAccount(userId, platform, accountId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: AUTH_MESSAGES.SOCIAL_ACCOUNT_REMOVED,
      statusCode: StatusCodes.OK,
      data: null,
    });
  }
);

export const AuthController = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
  addSocialAccount,
  removeSocialAccount,
};
