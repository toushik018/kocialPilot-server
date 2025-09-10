import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { CleanupService } from './cleanup.service';
import { sendResponse } from '../../utils/sendResponse';
import { AuthRequest } from '../auth/auth.interface';

/**
 * Get cleanup statistics
 */
const getCleanupStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await CleanupService.getCleanupStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Cleanup statistics retrieved successfully',
    data: result,
  });
});

/**
 * Trigger manual cleanup (admin only)
 */
const triggerManualCleanup = catchAsync(async (req: AuthRequest, res: Response) => {
  // Check if user is admin
  const userRole = req.user?.role;
  if (userRole !== 'admin') {
    return sendResponse(res, {
      statusCode: StatusCodes.FORBIDDEN,
      success: false,
      message: 'Only administrators can trigger manual cleanup',
    });
  }

  const result = await CleanupService.triggerManualCleanup();

  sendResponse(res, {
    statusCode: result.success ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR,
    success: result.success,
    message: result.message,
    data: result.stats,
  });
});

/**
 * Run automatic cleanup (internal endpoint)
 */
const runAutomaticCleanup = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await CleanupService.cleanupOldDeletedPosts();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Automatic cleanup completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Automatic cleanup failed:', error);
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Automatic cleanup failed',
    });
  }
});

export const CleanupController = {
  getCleanupStats,
  triggerManualCleanup,
  runAutomaticCleanup,
};