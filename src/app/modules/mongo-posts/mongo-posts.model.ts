import { Schema, model } from 'mongoose';
import { IMongoPost, MongoPostModel } from './mongo-posts.interface';

const PostSchema = new Schema<IMongoPost>(
  {
    user_id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
    },
    image_url: {
      type: String,
    },
    image_path: {
      type: String,
    },
    video_url: {
      type: String,
    },
    video_path: {
      type: String,
    },
    caption: {
      type: String,
      required: true,
    },
    hashtags: [
      {
        type: String,
      },
    ],
    alt_text: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    scheduled_date: {
      type: Date,
    },
    scheduled_time: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft',
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin'],
    },
    auto_scheduled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Explicitly set collection name to 'posts'
export const Post = model<IMongoPost, MongoPostModel>(
  'Post',
  PostSchema,
  'posts'
);
