import { Model, Types } from 'mongoose';

export type IMongoPost = {
  _id?: Types.ObjectId;
  user_id: string;
  username?: string;
  email?: string;
  image_url?: string;
  image_path?: string;
  caption: string;
  hashtags?: string[];
  alt_text?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  scheduled_date?: Date;
  scheduled_time?: string;
  status: 'draft' | 'published' | 'scheduled';
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  auto_scheduled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MongoPostModel = Model<IMongoPost>;

export type IMongoPostFilters = {
  searchTerm?: string;
  title?: string;
  status?: string;
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
};
