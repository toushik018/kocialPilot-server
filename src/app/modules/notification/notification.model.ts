import { Schema, model } from 'mongoose';
import {
  NOTIFICATION_EXPIRY,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
} from './notification.constant';
import { INotification } from './notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITY),
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: 'unread',
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + NOTIFICATION_EXPIRY.DEFAULT_TTL),
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if notification is read
notificationSchema.virtual('isRead').get(function () {
  return this.status === NOTIFICATION_STATUS.READ;
});

// Pre-save middleware to set readAt when status changes to read
notificationSchema.pre('save', function (this: INotification, next) {
  if (
    this.isModified('status') &&
    this.status === NOTIFICATION_STATUS.READ &&
    !this.readAt
  ) {
    this.readAt = new Date();
  }
  next();
});

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function (userId: string) {
  return this.countDocuments({
    userId,
    status: 'unread',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function (userId: string) {
  return this.updateMany(
    {
      userId,
      status: 'unread',
    },
    {
      $set: {
        status: 'read',
        readAt: new Date(),
      },
    }
  );
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

export const Notification = model<INotification>(
  'Notification',
  notificationSchema
);
