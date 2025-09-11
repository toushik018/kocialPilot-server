import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  IPasswordChange,
  IUserProfileUpdate,
  IUserStats,
} from './user.interface';
import { UserService } from './user.service';

const updateProfile = catchAsync(async (req: Request, res: Response) => {
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

const changePassword = catchAsync(async (req: Request, res: Response) => {
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

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const result = await UserService.getUserProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const result: IUserStats = await UserService.getUserStats(userId);

  sendResponse<IUserStats>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User statistics retrieved successfully',
    data: result,
  });
});

const getUserActivity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const result = await UserService.getUserActivity(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User activity retrieved successfully',
    data: result,
  });
});

const trackLogout = catchAsync(async (req: Request, res: Response) => {
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
