import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ISchedule } from './schedule.interface';
import { ScheduleService } from './schedule.service';
import { MongoPostService } from '../mongo-posts/mongo-posts.service';

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
  // Post scheduling related
  getOptimalScheduleTime: catchAsync<AuthRequest>(
    async (req: AuthRequest, res: Response) => {
      const userId = req.user?.userId;
      if (!userId) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          success: false,
          message: 'User authentication required',
        });
      }

      // Reuse MongoPostService logic to compute next time
      const userSchedule = await MongoPostService.getUserSchedule(userId);

      const latestPost = await (await import('../mongo-posts/mongo-posts.model'))
        .Post.findOne({ user_id: userId, status: 'scheduled' })
        .sort({ scheduled_date: -1 });

      let scheduledDate = new Date();
      let scheduledTime = '09:00';
      if (userSchedule) {
        scheduledTime = userSchedule.time;
        if (latestPost && latestPost.scheduled_date) {
          scheduledDate = new Date(latestPost.scheduled_date);
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        } else {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
      } else {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      scheduledDate.setHours(parseInt(scheduledTime.split(':')[0]) || 9);
      scheduledDate.setMinutes(parseInt(scheduledTime.split(':')[1]) || 0);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Optimal schedule time calculated successfully',
        data: {
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledTime,
        },
      });
    }
  ),
  reschedulePost: catchAsync<AuthRequest>(
    async (req: AuthRequest, res: Response) => {
      const { id } = req.params;
      const { scheduled_date, scheduled_time } = req.body as {
        scheduled_date: string;
        scheduled_time: string;
      };
      if (!scheduled_date || !scheduled_time) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Scheduled date and time are required',
        });
      }

      const result = await MongoPostService.updatePost(id, {
        scheduled_date: new Date(scheduled_date),
        scheduled_time,
        status: 'scheduled',
      });

      if (!result) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          success: false,
          message: 'Post not found',
        });
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Post rescheduled successfully',
        data: result,
      });
    }
  ),
  scheduleDraftPosts: catchAsync<AuthRequest>(
    async (req: AuthRequest, res: Response) => {
      const { postIds, scheduled_date, scheduled_time } = req.body as {
        postIds: string[];
        scheduled_date: string;
        scheduled_time: string;
      };
      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Post IDs are required',
        });
      }
      if (!scheduled_date || !scheduled_time) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Scheduled date and time are required',
        });
      }
      const updatedPosts = [] as unknown[];
      const errors: string[] = [];
      for (const id of postIds) {
        try {
          const result = await MongoPostService.updatePost(id, {
            scheduled_date: new Date(scheduled_date),
            scheduled_time,
            status: 'scheduled',
          });
          if (result) updatedPosts.push(result);
          else errors.push(`Post with ID ${id} not found`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          errors.push(`Error updating post ${id}: ${msg}`);
        }
      }
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${updatedPosts.length} posts scheduled successfully`,
        data: { updatedPosts, errors: errors.length ? errors : undefined },
      });
    }
  ),
  scheduleSingleDraftPost: catchAsync<AuthRequest>(
    async (req: AuthRequest, res: Response) => {
      const { id } = req.params;
      const { scheduled_date, scheduled_time } = req.body as {
        scheduled_date: string;
        scheduled_time: string;
      };
      if (!scheduled_date || !scheduled_time) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Scheduled date and time are required',
        });
      }
      const result = await MongoPostService.updatePost(id, {
        scheduled_date: new Date(scheduled_date),
        scheduled_time,
        status: 'scheduled',
      });
      if (!result) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          success: false,
          message: 'Post not found',
        });
      }
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Post scheduled successfully',
        data: result,
      });
    }
  ),
};
