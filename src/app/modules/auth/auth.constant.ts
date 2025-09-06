// Authentication module constants

export const AUTH_CONSTANTS = {
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  },

  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },

  COOKIE_NAMES: {
    REFRESH_TOKEN: 'refreshToken',
  },

  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 6,
  },

  TOKEN_EXPIRY: {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
  },

  SOCIAL_PLATFORMS: {
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
    TWITTER: 'twitter',
    LINKEDIN: 'linkedin',
  },
} as const;

export const AUTH_MESSAGES = {
  REGISTRATION_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'User logged in successfully',
  LOGOUT_SUCCESS: 'User logged out successfully',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
  SOCIAL_ACCOUNT_ADDED: 'Social account added successfully',
  SOCIAL_ACCOUNT_REMOVED: 'Social account removed successfully',

  // Error messages
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  SOCIAL_ACCOUNT_EXISTS: 'Social account already connected',
} as const;

export const USER_ROLE = {
  user: 'user',
  admin: 'admin',
} as const;
