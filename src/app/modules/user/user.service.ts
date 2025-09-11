import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { User } from '../auth/auth.model';
import { MongoPdf } from '../mongo-pdf/mongo-pdf.model';
import { Post } from '../mongo-posts/mongo-posts.model';
import { Video } from '../video/video.model';
import {
  IPasswordChange,
  IUserProfileUpdate,
  IUserStats,
  IUserActivity,
} from './user.interface';
import { UserActivity } from './user.model';
import config from '../../config';

const updateUserProfile = async (
  userId: string,
  updateData: IUserProfileUpdate,
  ipAddress?: string,
  userAgent?: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password');

  // Log activity
  await logUserActivity({
    userId: new Types.ObjectId(userId),
    action: 'profile_update',
    timestamp: new Date(),
    ipAddress,
    userAgent,
    metadata: {
      updatedFields: Object.keys(updateData).join(', '),
    },
  });

  return updatedUser;
};

const changePassword = async (
  userId: string,
  passwordData: IPasswordChange,
  ipAddress?: string,
  userAgent?: string
) => {
  const { currentPassword, newPassword, confirmPassword } = passwordData;

  if (newPassword !== confirmPassword) {
    throw new Error('New password and confirm password do not match');
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new Error('User not found');
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  await User.findByIdAndUpdate(userId, {
    password: hashedNewPassword,
    passwordChangedAt: new Date(),
  });

  // Log activity
  await logUserActivity({
    userId: new Types.ObjectId(userId),
    action: 'password_change',
    timestamp: new Date(),
    ipAddress,
    userAgent,
  });

  return { message: 'Password changed successfully' };
};

const logUserActivity = async (activityData: IUserActivity) => {
  try {
    await UserActivity.create(activityData);
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
};

const trackLogin = async (
  userId: string,
  ipAddress?: string,
  userAgent?: string
) => {
  await User.findByIdAndUpdate(userId, {
    lastLogin: new Date(),
  });

  await logUserActivity({
    userId: new Types.ObjectId(userId),
    action: 'login',
    timestamp: new Date(),
    ipAddress,
    userAgent,
  });
};

const trackLogout = async (
  userId: string,
  ipAddress?: string,
  userAgent?: string
) => {
  await User.findByIdAndUpdate(userId, {
    lastLogout: new Date(),
  });

  await logUserActivity({
    userId: new Types.ObjectId(userId),
    action: 'logout',
    timestamp: new Date(),
    ipAddress,
    userAgent,
  });
};

const getUserStats = async (userId: string): Promise<IUserStats> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const [totalPosts, totalVideos, totalPdfs, lastActivity] = await Promise.all([
    Post.countDocuments({ user_id: userId, isDeleted: { $ne: true } }),
    Video.countDocuments({ owner: userId, isDeleted: { $ne: true } }),
    MongoPdf.countDocuments({ owner: userId, isDeleted: { $ne: true } }),
    UserActivity.findOne({ userId }).sort({ timestamp: -1 }),
  ]);

  const accountAge = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalPosts,
    totalVideos,
    totalPdfs,
    lastActivity: lastActivity?.timestamp || user.createdAt,
    accountAge,
  };
};

const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

const getUserActivity = async (userId: string, limit = 10) => {
  const activities = await UserActivity.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return activities;
};

export const UserService = {
  updateUserProfile,
  changePassword,
  logUserActivity,
  trackLogin,
  trackLogout,
  getUserStats,
  getUserProfile,
  getUserActivity,
};
