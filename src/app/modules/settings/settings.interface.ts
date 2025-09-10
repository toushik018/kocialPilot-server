export interface IUserSettings {
  _id?: string;
  userId: string;
  preferences: {
    timezone: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  notifications: {
    email: {
      enabled: boolean;
      marketing: boolean;
      security: boolean;
      updates: boolean;
    };
    push: {
      enabled: boolean;
      posts: boolean;
      comments: boolean;
      mentions: boolean;
    };
    sms: {
      enabled: boolean;
      security: boolean;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    allowTagging: boolean;
    allowMessaging: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeout: number; // in minutes
  };
  social: {
    autoPost: boolean;
    defaultPlatforms: string[];
    crossPost: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISettingsUpdateRequest {
  preferences?: Partial<IUserSettings['preferences']>;
  notifications?: Partial<IUserSettings['notifications']>;
  privacy?: Partial<IUserSettings['privacy']>;
  security?: Partial<IUserSettings['security']>;
  social?: Partial<IUserSettings['social']>;
}

export interface INotificationSettings {
  type: 'email' | 'push' | 'sms';
  category: string;
  enabled: boolean;
}

export interface IPrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  allowTagging: boolean;
  allowMessaging: boolean;
}

export interface ISecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
}

export interface IAccountDeletionRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

export interface IDataExportRequest {
  format: 'json' | 'csv';
  includeMedia: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}