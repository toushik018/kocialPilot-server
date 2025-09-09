import { Schema, model } from 'mongoose';
import { IVideoDocument } from './video.interface';

const videoSchema = new Schema<IVideoDocument>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
    },
    mimetype: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    duration: {
      type: Number,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    caption: {
      type: String,
      default: null,
    },
    captionStatus: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
      index: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    socialMediaPlatforms: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ userId: 1, scheduledDate: 1 });
videoSchema.index({ userId: 1, isScheduled: 1 });
videoSchema.index({ userId: 1, captionStatus: 1 });

export const Video = model<IVideoDocument>('Video', videoSchema);
