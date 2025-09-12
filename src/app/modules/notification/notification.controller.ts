import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { notificationService } from './notification.service';
import { NotificationValidation } from './notification.validation';
import { NotificationType, NotificationStatus, NotificationPriority } from './notification.interface';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
  };
}

// Create a new notification
const createNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const validatedData = NotificationValidation.createNotificationValidationSchema.parse(req).body;
  const serviceData = {
    ...validatedData,
    type: validatedData.type as NotificationType,
    priority: validatedData.priority as NotificationPriority,
    expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
  };
  const result = await notificationService.createNotification(serviceData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Notification created successfully',
    data: result.data,
  });
});

// Get notifications for the authenticated user
const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const query = NotificationValidation.getNotificationsValidationSchema.parse(req).query;
  const serviceQuery = {
    ...query,
    type: query.type as NotificationType | undefined,
    status: query.status as NotificationStatus | undefined,
    priority: query.priority as NotificationPriority | undefined,
    page: query.page ? parseInt(query.page) : undefined,
    limit: query.limit ? parseInt(query.limit) : undefined
  };
  const result = await notificationService.getNotifications(userId, serviceQuery);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result.data,
    meta: result.pagination,
  });
});

// Get a single notification by ID
const getNotificationById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const result = await notificationService.getNotificationById(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification retrieved successfully',
    data: result.data,
  });
});

// Update a notification
const updateNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const updateData = NotificationValidation.updateNotificationValidationSchema.parse(req).body;
  const serviceUpdateData = {
    ...updateData,
    status: updateData.status as NotificationStatus | undefined,
    readAt: updateData.readAt ? new Date(updateData.readAt) : undefined
  };
  const result = await notificationService.updateNotification(id, userId, serviceUpdateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification updated successfully',
    data: result.data,
  });
});

// Mark a notification as read
const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const result = await notificationService.markAsRead(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification marked as read',
    data: result.data,
  });
});

// Mark all notifications as read
const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const result = await notificationService.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
  });
});

// Delete a notification
const deleteNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  await notificationService.deleteNotification(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification deleted successfully',
  });
});

// Bulk update notifications
const bulkUpdateNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const { notificationIds, action } = NotificationValidation.bulkUpdateValidationSchema.parse(req).body;
  const result = await notificationService.bulkUpdateNotifications(
    notificationIds,
    userId,
    action
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
  });
});

// Get notification statistics
const getNotificationStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const stats = await notificationService.getNotificationStats(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification statistics retrieved successfully',
    data: stats,
  });
});

// Get unread notification count
const getUnreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'Authentication required',
    });
  }
  
  const stats = await notificationService.getNotificationStats(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unread count retrieved successfully',
    data: { count: stats.unread },
  });
});

export const notificationController = {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  bulkUpdateNotifications,
  getNotificationStats,
  getUnreadCount,
};