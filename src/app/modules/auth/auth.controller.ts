import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
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
  const { refreshToken, accessToken, user } = result;

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    domain:
      config.NODE_ENV === 'production'
        ? '.kocial-pilot.vercel.app'
        : 'localhost',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
    statusCode: StatusCodes.OK,
    data: {
      accessToken,
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
  const { refreshToken } = req.cookies;
  const result = await AuthService.refreshToken(refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const result = await AuthService.getUserProfile(userId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const result = await AuthService.updateUserProfile(userId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.PROFILE_UPDATE_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  await AuthService.changePassword(userId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS,
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const addSocialAccount = catchAsync(async (req: AuthRequest, res: Response) => {
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
  getProfile,
  updateProfile,
  changePassword,
  addSocialAccount,
  removeSocialAccount,
};
