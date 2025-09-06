import { Schema, model } from 'mongoose';
import {
  ISocialMediaAccount,
  SocialMediaAccountModel,
} from './social-media.interface';

const SocialMediaAccountSchema = new Schema<ISocialMediaAccount>(
  {
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin'],
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    accountId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const SocialMediaAccount = model<
  ISocialMediaAccount,
  SocialMediaAccountModel
>('SocialMediaAccount', SocialMediaAccountSchema);
