import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  IPasswordChange,
  IUserProfileUpdate,
  IUserStats,
} from './user.interface';
import { UserService } from './user.service';
import { AuthRequest } from '../auth/auth.interface';

const ensureAuthorized = (req: AuthRequest, userId: string) => {
  const authUser = req.user;
  if (!authUser) {
    return {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User authentication required',
    } as const;
  }

  if (authUser.role === 'admin' || authUser.userId === userId) {
    return null;
  }

  return {
    statusCode: httpStatus.FORBIDDEN,
    success: false,
    message: 'You do not have permission to access this resource',
  } as const;
};

const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;
  const updateData: IUserProfileUpdate = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const authorizationError = ensureAuthorized(req, userId);
  if (authorizationError) {
    return sendResponse(res, authorizationError);
  }

  const result = await UserService.updateUserProfile(
    userId,
    updateData,
    ipAddress,
    userAgent
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;
  const passwordData: IPasswordChange = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const authorizationError = ensureAuthorized(req, userId);
  if (authorizationError) {
    return sendResponse(res, authorizationError);
  }

  const result = await UserService.changePassword(
    userId,
    passwordData,
    ipAddress,
    userAgent
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

const getUserProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const authorizationError = ensureAuthorized(req, userId);
  if (authorizationError) {
    return sendResponse(res, authorizationError);
  }

  const result = await UserService.getUserProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const getUserStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const authorizationError = ensureAuthorized(req, userId);
  if (authorizationError) {
    return sendResponse(res, authorizationError);
  }

  const result: IUserStats = await UserService.getUserStats(userId);

  sendResponse<IUserStats>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User statistics retrieved successfully',
    data: result,
  });
});

const getUserActivity = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const authorizationError = ensureAuthorized(req, userId);
  if (authorizationError) {
    return sendResponse(res, authorizationError);
  }

  const result = await UserService.getUserActivity(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User activity retrieved successfully',
    data: result,
  });
});

const trackLogout = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const authorizationError = ensureAuthorized(req, userId);
  if (authorizationError) {
    return sendResponse(res, authorizationError);
  }

  await UserService.trackLogout(userId, ipAddress, userAgent);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logout tracked successfully',
  });
});

export const UserController = {
  updateProfile,
  changePassword,
  getUserProfile,
  getUserStats,
  getUserActivity,
  trackLogout,
};
