import { Document, Types } from 'mongoose';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
} from './notification.constant';

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];
export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  data?: Record<string, unknown>; // Additional data for the notification
  actionUrl?: string; // URL to navigate when notification is clicked
  expiresAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface IUpdateNotificationRequest {
  status?: NotificationStatus;
  readAt?: Date;
}

export interface INotificationQuery {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface INotificationResponse {
  success: boolean;
  message: string;
  data?: INotification | INotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface INotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface IScheduledNotification {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  scheduledFor: Date;
  data?: Record<string, unknown>;
  actionUrl?: string;
}
