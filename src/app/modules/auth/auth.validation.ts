import { z } from 'zod';

const registerValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email address'),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, 'Password must be at least 6 characters'),
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name cannot exceed 50 characters')
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(50, 'Last name cannot exceed 50 characters')
      .optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email address'),
    password: z.string({
      required_error: 'Password is required',
    }),
  }),
});

const updateProfileValidationSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(50, 'First name cannot exceed 50 characters')
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(50, 'Last name cannot exceed 50 characters')
      .optional(),
    profilePicture: z.string().url('Invalid profile picture URL').optional(),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    website: z
      .string()
      .max(200, 'Website URL cannot exceed 200 characters')
      .optional(),
    location: z
      .string()
      .max(100, 'Location cannot exceed 100 characters')
      .optional(),
    preferences: z
      .object({
        timezone: z.string().optional(),
        language: z.string().optional(),
        notifications: z
          .object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: 'Current password is required',
    }),
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, 'New password must be at least 6 characters'),
  }),
});

const socialAccountValidationSchema = z.object({
  body: z.object({
    platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin'], {
      required_error: 'Platform is required',
    }),
    accountId: z.string({
      required_error: 'Account ID is required',
    }),
    accountName: z.string({
      required_error: 'Account name is required',
    }),
    accessToken: z.string({
      required_error: 'Access token is required',
    }),
    refreshToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema,
  socialAccountValidationSchema,
};
