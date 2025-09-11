import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { User } from '../auth/auth.model';
import { MongoPdf } from '../mongo-pdf/mongo-pdf.model';
import { Post } from '../mongo-posts/mongo-posts.model';
import { UserActivity } from '../user/user.model';
import { Video } from '../video/video.model';
import {
  IAccountDeletionRequest,
  IDataExportRequest,
  ISettingsUpdateRequest,
  IUserSettings,
} from './settings.interface';
import { UserSettings } from './settings.model';

const getUserSettings = async (userId: string): Promise<IUserSettings> => {
  let settings = await UserSettings.findOne({ userId });

  // Create default settings if none exist
  if (!settings) {
    settings = await UserSettings.create({ userId });
  }

  return settings;
};

const updateUserSettings = async (
  userId: string,
  updateData: ISettingsUpdateRequest
): Promise<IUserSettings> => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, upsert: true }
  );

  if (!settings) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Settings not found');
  }

  return settings;
};

const updateNotificationSettings = async (
  userId: string,
  notificationData: Partial<IUserSettings['notifications']>
): Promise<IUserSettings> => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: { notifications: notificationData } },
    { new: true, upsert: true }
  );

  if (!settings) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Settings not found');
  }

  return settings;
};

const updatePrivacySettings = async (
  userId: string,
  privacyData: Partial<IUserSettings['privacy']>
): Promise<IUserSettings> => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: { privacy: privacyData } },
    { new: true, upsert: true }
  );

  if (!settings) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Settings not found');
  }

  return settings;
};

const updateSecuritySettings = async (
  userId: string,
  securityData: Partial<IUserSettings['security']>
): Promise<IUserSettings> => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: { security: securityData } },
    { new: true, upsert: true }
  );

  if (!settings) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Settings not found');
  }

  return settings;
};

const exportUserData = async (
  userId: string,
  exportRequest: IDataExportRequest
): Promise<{
  user: Record<string, unknown>;
  posts: Record<string, unknown>[];
  videos: Record<string, unknown>[];
  pdfs: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  settings: Record<string, unknown>;
}> => {
  const { includeMedia, dateRange } = exportRequest;

  // Build date filter if provided
  const dateFilter: Record<string, unknown> = {};
  if (dateRange) {
    dateFilter.createdAt = {
      $gte: dateRange.from,
      $lte: dateRange.to,
    };
  }

  // Fetch user data
  const [user, posts, videos, pdfs, activities, settings] = await Promise.all([
    User.findById(userId).select('-password'),
    Post.find({ user_id: userId, ...dateFilter }),
    Video.find({ owner: userId, ...dateFilter }),
    MongoPdf.find({ owner: userId, ...dateFilter }),
    UserActivity.find({ userId, ...dateFilter }).limit(1000),
    UserSettings.findOne({ userId }),
  ]);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Prepare export data
  const exportData = {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
    posts: posts.map((post) => ({
      id: post._id,
      caption: post.caption,
      hashtags: post.hashtags,
      platform: post.platform,
      status: post.status,
      imageUrl: includeMedia ? post.image_url : null,
      videoUrl: includeMedia ? post.video_url : null,
      createdAt: post.createdAt,
    })),
    videos: videos.map((video) => ({
      id: video._id,
      filename: video.filename,
      description: video.description,
      tags: video.tags,
      url: includeMedia ? video.url : null,
      thumbnail: includeMedia ? video.thumbnail : null,
      createdAt: video.createdAt,
    })),
    pdfs: pdfs.map((pdf) => ({
      id: pdf._id,
      title: pdf.title,
      summary: pdf.summary,
      analysisStatus: pdf.analysisStatus,
      fileUrl: includeMedia ? pdf.fileUrl : null,
      createdAt: pdf.createdAt,
    })),
    activities: activities.map((activity) => ({
      action: activity.action,
      timestamp: activity.timestamp,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
    })),
    settings: settings || {},
  };

  return exportData;
};

const deleteUserAccount = async (
  userId: string,
  deletionRequest: IAccountDeletionRequest
): Promise<{ message: string }> => {
  const { password, reason, feedback } = deletionRequest;

  // Verify user and password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid password');
  }

  // Log deletion activity
  await UserActivity.create({
    userId,
    action: 'account_deletion_requested',
    timestamp: new Date(),
    metadata: {
      reason: reason || 'No reason provided',
      feedback: feedback || 'No feedback provided',
    },
  });

  // Soft delete user data
  await Promise.all([
    User.findByIdAndUpdate(userId, {
      isActive: false,
      email: `deleted_${Date.now()}_${user.email}`,
    }),
    Post.updateMany({ user_id: userId }, { isDeleted: true }),
    Video.updateMany({ owner: userId }, { isDeleted: true }),
    MongoPdf.updateMany({ owner: userId }, { isDeleted: true }),
    UserSettings.findOneAndDelete({ userId }),
  ]);

  return {
    message:
      "Account has been successfully deleted. We're sorry to see you go!",
  };
};

const resetUserSettings = async (userId: string): Promise<IUserSettings> => {
  // Delete existing settings
  await UserSettings.findOneAndDelete({ userId });

  // Create new default settings
  const newSettings = await UserSettings.create({ userId });

  return newSettings;
};

export const SettingsService = {
  getUserSettings,
  updateUserSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateSecuritySettings,
  exportUserData,
  deleteUserAccount,
  resetUserSettings,
};
