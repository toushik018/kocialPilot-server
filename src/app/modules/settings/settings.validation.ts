import { z } from 'zod';

export const updateSettingsValidation = z.object({
  body: z.object({
    preferences: z.object({
      timezone: z.string().optional(),
      language: z.string().min(2).max(5).optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      dateFormat: z.string().optional(),
      timeFormat: z.enum(['12h', '24h']).optional(),
    }).optional(),
    notifications: z.object({
      email: z.object({
        enabled: z.boolean().optional(),
        marketing: z.boolean().optional(),
        security: z.boolean().optional(),
        updates: z.boolean().optional(),
      }).optional(),
      push: z.object({
        enabled: z.boolean().optional(),
        posts: z.boolean().optional(),
        comments: z.boolean().optional(),
        mentions: z.boolean().optional(),
      }).optional(),
      sms: z.object({
        enabled: z.boolean().optional(),
        security: z.boolean().optional(),
      }).optional(),
    }).optional(),
    privacy: z.object({
      profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional(),
      allowTagging: z.boolean().optional(),
      allowMessaging: z.boolean().optional(),
    }).optional(),
    security: z.object({
      twoFactorEnabled: z.boolean().optional(),
      loginAlerts: z.boolean().optional(),
      sessionTimeout: z.number().min(15).max(1440).optional(),
    }).optional(),
    social: z.object({
      autoPost: z.boolean().optional(),
      defaultPlatforms: z.array(z.string()).optional(),
      crossPost: z.boolean().optional(),
    }).optional(),
  }),
});

export const updateNotificationSettingsValidation = z.object({
  body: z.object({
    email: z.object({
      enabled: z.boolean().optional(),
      marketing: z.boolean().optional(),
      security: z.boolean().optional(),
      updates: z.boolean().optional(),
    }).optional(),
    push: z.object({
      enabled: z.boolean().optional(),
      posts: z.boolean().optional(),
      comments: z.boolean().optional(),
      mentions: z.boolean().optional(),
    }).optional(),
    sms: z.object({
      enabled: z.boolean().optional(),
      security: z.boolean().optional(),
    }).optional(),
  }),
});

export const updatePrivacySettingsValidation = z.object({
  body: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    allowTagging: z.boolean().optional(),
    allowMessaging: z.boolean().optional(),
  }),
});

export const updateSecuritySettingsValidation = z.object({
  body: z.object({
    twoFactorEnabled: z.boolean().optional(),
    loginAlerts: z.boolean().optional(),
    sessionTimeout: z.number().min(15).max(1440).optional(),
  }),
});

export const exportDataValidation = z.object({
  body: z.object({
    format: z.enum(['json', 'csv']),
    includeMedia: z.boolean().default(false),
    dateRange: z.object({
      from: z.string().datetime().transform((str) => new Date(str)),
      to: z.string().datetime().transform((str) => new Date(str)),
    }).optional(),
  }),
});

export const deleteAccountValidation = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
    reason: z.string().optional(),
    feedback: z.string().optional(),
  }),
});

export const userIdValidation = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
});