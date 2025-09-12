import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthRequest } from '../auth/auth.interface';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  IAccountDeletionRequest,
  IDataExportRequest,
  ISettingsUpdateRequest,
} from './settings.interface';
import { SettingsService } from './settings.service';

const getUserSettings = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.getUserSettings(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User settings retrieved successfully',
      data: result,
    });
  }
);

const updateUserSettings = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const updateData: ISettingsUpdateRequest = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.updateUserSettings(userId, updateData);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Settings updated successfully',
      data: result,
    });
  }
);

const updateNotificationSettings = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const notificationData = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.updateNotificationSettings(
      userId,
      notificationData
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Notification settings updated successfully',
      data: result,
    });
  }
);

const updatePrivacySettings = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const privacyData = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.updatePrivacySettings(
      userId,
      privacyData
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Privacy settings updated successfully',
      data: result,
    });
  }
);

const updateSecuritySettings = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const securityData = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.updateSecuritySettings(
      userId,
      securityData
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Security settings updated successfully',
      data: result,
    });
  }
);

const exportUserData = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const exportRequest: IDataExportRequest = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.exportUserData(userId, exportRequest);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User data exported successfully',
      data: result,
    });
  }
);

const deleteUserAccount = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const deletionRequest: IAccountDeletionRequest = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.deleteUserAccount(
      userId,
      deletionRequest
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
    });
  }
);

const resetUserSettings = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await SettingsService.resetUserSettings(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Settings reset to defaults successfully',
      data: result,
    });
  }
);

export const SettingsController = {
  getUserSettings,
  updateUserSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateSecuritySettings,
  exportUserData,
  deleteUserAccount,
  resetUserSettings,
};
