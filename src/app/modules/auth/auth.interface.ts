import { Request } from 'express';
import { Document } from 'mongoose';

// Base interface for all documents
export interface IBaseDocument extends Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// JWT User Payload Interface
export interface IJWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Social Account Interface
export interface ISocialAccount {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
}

// User Interface
export interface IUser extends IBaseDocument {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  location?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  role: 'user' | 'admin';
  lastLogin?: Date;
  lastLogout?: Date;
  passwordChangedAt?: Date;
  preferences: {
    timezone?: string;
    language?: string;
    theme?: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  socialAccounts: ISocialAccount[];
  comparePassword(_password: string): Promise<boolean>;

  // Virtual fields
  username?: string;
  name?: string;
}

// Request Interfaces
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IUserUpdateRequest {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  location?: string;
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

export interface ISocialAccountRequest {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Response Interfaces
export interface IAuthResponse {
  user: Partial<Omit<IUser, 'password' | 'comparePassword'>>;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Authenticated Request Interface
export interface AuthRequest extends Request {
  user?: IJWTPayload;
}
