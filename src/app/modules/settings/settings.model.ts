import { Schema, model } from 'mongoose';
import { IUserSettings } from './settings.interface';

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    preferences: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      language: {
        type: String,
        default: 'en',
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light',
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
      },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h',
      },
    },
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        marketing: {
          type: Boolean,
          default: false,
        },
        security: {
          type: Boolean,
          default: true,
        },
        updates: {
          type: Boolean,
          default: true,
        },
      },
      push: {
        enabled: {
          type: Boolean,
          default: true,
        },
        posts: {
          type: Boolean,
          default: true,
        },
        comments: {
          type: Boolean,
          default: true,
        },
        mentions: {
          type: Boolean,
          default: true,
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false,
        },
        security: {
          type: Boolean,
          default: false,
        },
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public',
      },
      showEmail: {
        type: Boolean,
        default: false,
      },
      showPhone: {
        type: Boolean,
        default: false,
      },
      allowTagging: {
        type: Boolean,
        default: true,
      },
      allowMessaging: {
        type: Boolean,
        default: true,
      },
    },
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      loginAlerts: {
        type: Boolean,
        default: true,
      },
      sessionTimeout: {
        type: Number,
        default: 480, // 8 hours in minutes
        min: 15,
        max: 1440, // 24 hours
      },
    },
    social: {
      autoPost: {
        type: Boolean,
        default: false,
      },
      defaultPlatforms: {
        type: [String],
        default: [],
      },
      crossPost: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Index for efficient queries
UserSettingsSchema.index({ userId: 1 });

export const UserSettings = model<IUserSettings>(
  'UserSettings',
  UserSettingsSchema
);
