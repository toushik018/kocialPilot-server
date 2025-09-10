import { Types } from 'mongoose';

export interface IUserProfileUpdate {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  preferences?: {
    timezone?: string;
    language?: string;
    theme?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
}

export interface IPasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IUserActivity {
  userId: Types.ObjectId;
  action: 'login' | 'logout' | 'password_change' | 'profile_update';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface IUserStats {
  totalPosts: number;
  totalVideos: number;
  totalPdfs: number;
  lastActivity: Date;
  accountAge: number; // in days
}