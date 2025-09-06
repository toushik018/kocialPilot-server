import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../app/utils/catchAsync';
import { sendResponse } from '../../../app/utils/sendResponse';
import { IDashboardStats } from './dashboard.interface';
import { DashboardService } from './dashboard.service';

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getStats();

  sendResponse<IDashboardStats>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

export const DashboardController = {
  getStats,
};
