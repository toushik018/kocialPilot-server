import { Document } from 'mongoose';

export interface IVideo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id?: any;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  caption?: string;
  captionStatus: 'pending' | 'generating' | 'completed' | 'failed';
  scheduledDate?: Date;
  isScheduled: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  socialMediaPlatforms?: string[];
  tags?: string[];
  description?: string;
  cloudinary_public_id?: string;
  thumbnail_cloudinary_public_id?: string;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoDocument extends Document {
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  caption?: string;
  captionStatus: 'pending' | 'generating' | 'completed' | 'failed';
  scheduledDate?: Date;
  isScheduled: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  socialMediaPlatforms?: string[];
  tags?: string[];
  description?: string;
  cloudinary_public_id?: string;
  thumbnail_cloudinary_public_id?: string;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoFilters {
  searchTerm?: string;
  userId?: string;
  captionStatus?: string;
  isScheduled?: boolean;
  isPublished?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface IVideoUpload {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any; // Multer file object
  scheduledDate?: string;
  description?: string;
  tags?: string[];
  socialMediaPlatforms?: string[];
}

export interface IVideoUpdate {
  caption?: string;
  scheduledDate?: Date;
  description?: string;
  tags?: string[];
  socialMediaPlatforms?: string[];
  isPublished?: boolean;
}

export interface ICaptionGenerationJob {
  videoId: string;
  videoPath: string;
  userId: string;
}
