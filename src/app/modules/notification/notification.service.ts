import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../error/AppError';
import {
  ICreateNotificationRequest,
  INotification,
  INotificationQuery,
  INotificationResponse,
  INotificationStats,
  IUpdateNotificationRequest,
} from './notification.interface';
import { Notification } from './notification.model';

class NotificationService {
  // Create a new notification
  async createNotification(
    notificationData: ICreateNotificationRequest
  ): Promise<INotificationResponse> {
    try {
      const notification = new Notification({
        ...notificationData,
        userId: new Types.ObjectId(notificationData.userId),
      });

      await notification.save();

      return {
        success: true,
        message: 'Notification created successfully',
        data: notification,
      };
    } catch {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to create notification'
      );
    }
  }

  // Get notifications for a user with pagination and filtering
  async getNotifications(
    userId: string,
    query: INotificationQuery
  ): Promise<INotificationResponse> {
    try {
      const {
        type,
        status,
        priority,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      // Build filter object
      const filter: Record<string, unknown> = {
        userId: new Types.ObjectId(userId),
        // Only show non-expired notifications
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      };

      if (type) filter.type = type;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      // Build sort object
      const sort: Record<string, 1 | -1> = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [notifications, total] = await Promise.all([
        Notification.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications as INotification[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve notifications'
      );
    }
  }

  // Get a single notification by ID
  async getNotificationById(
    notificationId: string,
    userId: string
  ): Promise<INotificationResponse> {
    try {
      const notification = await Notification.findOne({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      });

      if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification retrieved successfully',
        data: notification,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve notification'
      );
    }
  }

  // Update a notification
  async updateNotification(
    notificationId: string,
    userId: string,
    updateData: IUpdateNotificationRequest
  ): Promise<INotificationResponse> {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
        },
        updateData,
        { new: true, runValidators: true }
      );

      if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification updated successfully',
        data: notification,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to update notification'
      );
    }
  }

  // Mark a notification as read
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotificationResponse> {
    return this.updateNotification(notificationId, userId, {
      status: 'read',
      readAt: new Date(),
    });
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<INotificationResponse> {
    try {
      const result = await Notification.updateMany(
        {
          userId: new Types.ObjectId(userId),
          status: 'unread',
        },
        {
          $set: {
            status: 'read',
            readAt: new Date(),
          },
        }
      );

      return {
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
      };
    } catch {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to mark notifications as read'
      );
    }
  }

  // Delete a notification
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<INotificationResponse> {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      });

      if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
      }

      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to delete notification'
      );
    }
  }

  // Bulk update notifications
  async bulkUpdateNotifications(
    notificationIds: string[],
    userId: string,
    action: 'read' | 'unread' | 'archive' | 'delete'
  ): Promise<INotificationResponse> {
    try {
      const objectIds = notificationIds.map((id) => new Types.ObjectId(id));
      const filter = {
        _id: { $in: objectIds },
        userId: new Types.ObjectId(userId),
      };

      let result;
      switch (action) {
        case 'read':
          result = await Notification.updateMany(filter, {
            $set: { status: 'read', readAt: new Date() },
          });
          break;
        case 'unread':
          result = await Notification.updateMany(filter, {
            $set: { status: 'unread' },
            $unset: { readAt: 1 },
          });
          break;
        case 'archive':
          result = await Notification.updateMany(filter, {
            $set: { status: 'archived' },
          });
          break;
        case 'delete':
          result = await Notification.deleteMany(filter);
          break;
        default:
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid action');
      }

      const count =
        'modifiedCount' in result ? result.modifiedCount : result.deletedCount;
      return {
        success: true,
        message: `${count} notifications ${action}ed successfully`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to ${action} notifications`
      );
    }
  }

  // Get notification statistics for a user
  async getNotificationStats(userId: string): Promise<INotificationStats> {
    try {
      const pipeline = [
        {
          $match: {
            userId: new Types.ObjectId(userId),
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: new Date() } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] },
            },
            read: {
              $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] },
            },
            archived: {
              $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] },
            },
          },
        },
      ];

      const [stats] = await Notification.aggregate(pipeline);

      // Get stats by type and priority
      const [typeStats, priorityStats] = await Promise.all([
        Notification.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } },
              ],
            },
          },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Notification.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } },
              ],
            },
          },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

      const byType: Record<string, number> = {};
      const byPriority: Record<string, number> = {};

      typeStats.forEach((item) => {
        byType[item._id] = item.count;
      });

      priorityStats.forEach((item) => {
        byPriority[item._id] = item.count;
      });

      return {
        total: stats?.total || 0,
        unread: stats?.unread || 0,
        read: stats?.read || 0,
        archived: stats?.archived || 0,
        byType,
        byPriority,
      };
    } catch {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get notification statistics'
      );
    }
  }

  // Create system notifications for scheduled posts
  async createPostScheduledNotification(
    userId: string,
    postTitle: string,
    scheduledTime: Date
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'post_scheduled',
      title: 'Post Scheduled',
      message: `Your post "${postTitle}" has been scheduled for ${scheduledTime.toLocaleString()}`,
      priority: 'medium',
      actionUrl: '/dashboard/posts',
    });
  }

  // Create session expiry warning notification
  async createSessionExpiryNotification(
    userId: string,
    expiresIn: number
  ): Promise<void> {
    const minutes = Math.floor(expiresIn / (1000 * 60));
    await this.createNotification({
      userId,
      type: 'session_expiring',
      title: 'Session Expiring',
      message: `Your session will expire in ${minutes} minutes. Please save your work.`,
      priority: 'high',
      expiresAt: new Date(Date.now() + expiresIn),
    });
  }

  // Create social media account connection notification
  async createAccountConnectionNotification(
    userId: string,
    platform: string,
    connected: boolean
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: connected ? 'account_connected' : 'account_disconnected',
      title: `${platform} Account ${connected ? 'Connected' : 'Disconnected'}`,
      message: `Your ${platform} account has been ${connected ? 'successfully connected' : 'disconnected'}`,
      priority: 'medium',
      actionUrl: '/settings',
    });
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount || 0;
    } catch {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to cleanup expired notifications'
      );
    }
  }
}

export const notificationService = new NotificationService();
