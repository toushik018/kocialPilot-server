import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../error/AppError';
import { AUTH_MESSAGES } from './auth.constant';
import {
  IAuthResponse,
  IChangePasswordRequest,
  IJWTPayload,
  ILoginRequest,
  IRegisterRequest,
  ISocialAccountRequest,
  IUserUpdateRequest,
} from './auth.interface';
import { User } from './auth.model';
import { createToken, validatePassword } from './auth.utils';

const createUser = async (
  payload: IRegisterRequest
): Promise<IAuthResponse> => {
  const { email, password, firstName, lastName } = payload;

  // Validate password strength
  if (!validatePassword(password)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Password must be at least 6 characters long'
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError(
      StatusCodes.CONFLICT,
      AUTH_MESSAGES.EMAIL_ALREADY_EXISTS
    );
  }

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    firstName,
    lastName,
    isEmailVerified: false,
    isActive: true,
    role: 'user',
    preferences: {
      timezone: 'UTC',
      language: 'en',
      notifications: {
        email: true,
        push: true,
      },
    },
    socialAccounts: [],
  });

  // Generate tokens
  const jwtPayload: IJWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  // Update last login time
  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
  });

  // Calculate token expiry time in milliseconds
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      username: user.username, // Virtual field
      name: user.name, // Virtual field
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      preferences: user.preferences,
    },
    accessToken,
    refreshToken,
    expiresAt,
  };
};

const loginUser = async (payload: ILoginRequest): Promise<IAuthResponse> => {
  const { email, password } = payload;

  // Find user by email and include password
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password'
  );

  if (!user) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      AUTH_MESSAGES.INVALID_CREDENTIALS
    );
  }

  if (!user.isActive) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      AUTH_MESSAGES.ACCOUNT_DEACTIVATED
    );
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      AUTH_MESSAGES.INVALID_CREDENTIALS
    );
  }

  // Generate tokens
  const jwtPayload: IJWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  // Calculate token expiry time in milliseconds
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      username: user.username, // Virtual field
      name: user.name, // Virtual field
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      preferences: user.preferences,
    },
    accessToken,
    refreshToken,
    expiresAt,
  };
};

const logoutUser = async (refreshToken: string): Promise<void> => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
  }

  try {
    jwt.verify(refreshToken, config.jwt_refresh_secret as string);
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
  }
};

const refreshToken = async (
  token: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}> => {
  if (!token) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token is required');
  }

  let decoded: IJWTPayload;
  try {
    decoded = jwt.verify(
      token,
      config.jwt_refresh_secret as string
    ) as IJWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token has expired. Please log in again.'
      );
    }
    throw new AppError(StatusCodes.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
  }

  // Verify user still exists and is active
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new AppError(StatusCodes.UNAUTHORIZED, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  // Generate new tokens
  const jwtPayload: IJWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const newAccessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  // Generate new refresh token for enhanced security (token rotation)
  const newRefreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  // Calculate token expiry time in milliseconds
  const expiryTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresAt: expiryTime,
  };
};

const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
  }
  return user;
};

const updateUserProfile = async (
  userId: string,
  payload: IUserUpdateRequest
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  // Update user fields
  if (payload.firstName !== undefined) user.firstName = payload.firstName;
  if (payload.lastName !== undefined) user.lastName = payload.lastName;
  if (payload.profilePicture !== undefined)
    user.profilePicture = payload.profilePicture;
  if (payload.bio !== undefined) user.bio = payload.bio;
  if (payload.website !== undefined) user.website = payload.website;
  if (payload.location !== undefined) user.location = payload.location;

  if (payload.preferences) {
    if (payload.preferences.timezone)
      user.preferences.timezone = payload.preferences.timezone;
    if (payload.preferences.language)
      user.preferences.language = payload.preferences.language;
    if (payload.preferences.notifications) {
      if (payload.preferences.notifications.email !== undefined) {
        user.preferences.notifications.email =
          payload.preferences.notifications.email;
      }
      if (payload.preferences.notifications.push !== undefined) {
        user.preferences.notifications.push =
          payload.preferences.notifications.push;
      }
    }
  }

  await user.save();
  return user;
};

const changePassword = async (
  userId: string,
  payload: IChangePasswordRequest
): Promise<void> => {
  const { currentPassword, newPassword } = payload;

  // Find user with password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT
    );
  }

  // Validate new password
  if (!validatePassword(newPassword)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'New password must be at least 6 characters long'
    );
  }

  // Update password
  user.password = newPassword;
  await user.save();
};

const addSocialAccount = async (
  userId: string,
  payload: ISocialAccountRequest
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  // Check if account already exists
  const existingAccount = user.socialAccounts.find(
    (account) =>
      account.platform === payload.platform &&
      account.accountId === payload.accountId
  );

  if (existingAccount) {
    throw new AppError(
      StatusCodes.CONFLICT,
      AUTH_MESSAGES.SOCIAL_ACCOUNT_EXISTS
    );
  }

  // Add new social account
  const newAccount = {
    ...payload,
    isActive: true,
  };
  user.socialAccounts.push(newAccount);
  await user.save();

  return user.socialAccounts;
};

const removeSocialAccount = async (
  userId: string,
  platform: string,
  accountId: string
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  // Remove social account
  user.socialAccounts = user.socialAccounts.filter(
    (account) =>
      !(account.platform === platform && account.accountId === accountId)
  );

  await user.save();
};

export const AuthService = {
  createUser,
  loginUser,
  logoutUser,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  addSocialAccount,
  removeSocialAccount,
};
