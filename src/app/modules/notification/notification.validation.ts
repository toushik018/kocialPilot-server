import { z } from 'zod';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
} from './notification.constant';

const createNotificationValidationSchema = z.object({
  body: z.object({
    userId: z
      .string({
        required_error: 'User ID is required',
      })
      .min(1, 'User ID cannot be empty'),

    type: z.enum(Object.values(NOTIFICATION_TYPES) as [string, ...string[]], {
      required_error: 'Notification type is required',
      invalid_type_error: 'Invalid notification type',
    }),

    title: z
      .string({
        required_error: 'Title is required',
      })
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),

    message: z
      .string({
        required_error: 'Message is required',
      })
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters')
      .trim(),

    priority: z
      .enum(Object.values(NOTIFICATION_PRIORITY) as [string, ...string[]])
      .optional()
      .default('medium'),

    data: z.record(z.unknown()).optional(),

    actionUrl: z.string().url('Invalid URL format').optional(),

    expiresAt: z.string().datetime('Invalid date format').optional(),
  }),
});

const updateNotificationValidationSchema = z.object({
  body: z.object({
    status: z
      .enum(Object.values(NOTIFICATION_STATUS) as [string, ...string[]])
      .optional(),

    readAt: z.string().datetime('Invalid date format').optional(),
  }),
});

const getNotificationsValidationSchema = z.object({
  query: z.object({
    type: z
      .enum(Object.values(NOTIFICATION_TYPES) as [string, ...string[]])
      .optional(),

    status: z
      .enum(Object.values(NOTIFICATION_STATUS) as [string, ...string[]])
      .optional(),

    priority: z
      .enum(Object.values(NOTIFICATION_PRIORITY) as [string, ...string[]])
      .optional(),

    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .default('1'),

    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .default('10'),

    sortBy: z
      .enum(['createdAt', 'updatedAt', 'priority', 'type'])
      .optional()
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

const markAsReadValidationSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Notification ID is required',
      })
      .min(1, 'Notification ID cannot be empty'),
  }),
});

const bulkUpdateValidationSchema = z.object({
  body: z.object({
    notificationIds: z
      .array(z.string().min(1, 'Notification ID cannot be empty'))
      .min(1, 'At least one notification ID is required'),

    action: z.enum(['read', 'unread', 'archive', 'delete'], {
      required_error: 'Action is required',
      invalid_type_error: 'Invalid action type',
    }),
  }),
});

const scheduleNotificationValidationSchema = z.object({
  body: z.object({
    userId: z
      .string({
        required_error: 'User ID is required',
      })
      .min(1, 'User ID cannot be empty'),

    type: z.enum(Object.values(NOTIFICATION_TYPES) as [string, ...string[]], {
      required_error: 'Notification type is required',
      invalid_type_error: 'Invalid notification type',
    }),

    title: z
      .string({
        required_error: 'Title is required',
      })
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),

    message: z
      .string({
        required_error: 'Message is required',
      })
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters')
      .trim(),

    priority: z
      .enum(Object.values(NOTIFICATION_PRIORITY) as [string, ...string[]])
      .optional()
      .default('medium'),

    scheduledFor: z.string().datetime('Invalid date format'),

    data: z.record(z.unknown()).optional(),

    actionUrl: z.string().url('Invalid URL format').optional(),
  }),
});

export const NotificationValidation = {
  createNotificationValidationSchema,
  updateNotificationValidationSchema,
  getNotificationsValidationSchema,
  markAsReadValidationSchema,
  bulkUpdateValidationSchema,
  scheduleNotificationValidationSchema,
};
