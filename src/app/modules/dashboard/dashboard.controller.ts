import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../app/utils/catchAsync';
import { sendResponse } from '../../../app/utils/sendResponse';
import { IDashboardStats } from './dashboard.interface';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../auth/auth.interface';

const getStats = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const result = await DashboardService.getStats(userId);

    sendResponse<IDashboardStats>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: result,
    });
  }
);

export const DashboardController = {
  getStats,
};
