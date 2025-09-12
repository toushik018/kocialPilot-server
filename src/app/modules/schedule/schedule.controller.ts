import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ISchedule } from './schedule.interface';
import { ScheduleService } from './schedule.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const createSchedule = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    // Get user ID from auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    // Add user_id to schedule data
    const scheduleData = {
      ...req.body,
      user_id: userId,
    };

    const result = await ScheduleService.createSchedule(scheduleData);

    sendResponse<ISchedule>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Schedule created successfully',
      data: result,
    });
  }
);

const getUserSchedule = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await ScheduleService.getUserSchedule(userId);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'No active schedule found',
      });
    }

    sendResponse<ISchedule>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Schedule retrieved successfully',
      data: result,
    });
  }
);

const getAllUserSchedules = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await ScheduleService.getAllUserSchedules(userId);

    sendResponse<ISchedule[]>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All schedules retrieved successfully',
      data: result,
    });
  }
);

const updateSchedule = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await ScheduleService.updateSchedule(id, userId, req.body);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message:
          'Schedule not found or you do not have permission to update it',
      });
    }

    sendResponse<ISchedule>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Schedule updated successfully',
      data: result,
    });
  }
);

const deleteSchedule = catchAsync<AuthRequest>(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await ScheduleService.deleteSchedule(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Schedule not found',
      });
    }

    sendResponse<ISchedule>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Schedule deleted successfully',
      data: result,
    });
  }
);

export const ScheduleController = {
  createSchedule,
  getUserSchedule,
  getAllUserSchedules,
  updateSchedule,
  deleteSchedule,
};
