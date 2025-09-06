import { Model, Types } from 'mongoose';

export type ISocialMediaAccount = {
  _id?: Types.ObjectId;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  accountName: string;
  accountId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isConnected: boolean;
  owner: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SocialMediaAccountModel = Model<ISocialMediaAccount>;
