export const NOTIFICATION_TYPES = {
  POST_SCHEDULED: 'post_scheduled',
  POST_PUBLISHED: 'post_published',
  POST_FAILED: 'post_failed',
  SESSION_EXPIRING: 'session_expiring',
  SESSION_EXPIRED: 'session_expired',
  ACCOUNT_CONNECTED: 'account_connected',
  ACCOUNT_DISCONNECTED: 'account_disconnected',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  QUOTA_WARNING: 'quota_warning',
  QUOTA_EXCEEDED: 'quota_exceeded',
} as const;

export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived',
} as const;

export const NOTIFICATION_MESSAGES = {
  POST_SCHEDULED: 'Your post has been scheduled successfully',
  POST_PUBLISHED: 'Your post has been published',
  POST_FAILED: 'Failed to publish your post',
  SESSION_EXPIRING: 'Your session will expire in 5 minutes',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  ACCOUNT_CONNECTED: 'Social media account connected successfully',
  ACCOUNT_DISCONNECTED: 'Social media account disconnected',
  SYSTEM_MAINTENANCE: 'System maintenance scheduled',
  QUOTA_WARNING: 'You are approaching your usage limit',
  QUOTA_EXCEEDED: 'You have exceeded your usage limit',
} as const;

export const NOTIFICATION_EXPIRY = {
  SESSION_WARNING: 5 * 60 * 1000, // 5 minutes in milliseconds
  DEFAULT_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
} as const;
