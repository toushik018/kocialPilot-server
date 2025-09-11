import httpStatus from 'http-status';
import { SortOrder } from 'mongoose';
import AppError from '../../error/AppError';
import { paginationHelpers } from '../../helpers/paginationHelper';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOptions } from '../../interface/pagination';
import {
  IVideoDocument,
  IVideoFilters,
  IVideoUpload,
  IVideoUpdate,
} from './video.interface';
import { Video } from './video.model';
import { videoSearchableFields } from './video.constant';
import fs from 'fs';
import path from 'path';
import { videoCaptionQueue } from './video.queue';
import { Post } from '../mongo-posts/mongo-posts.model';
import { IMongoPost } from '../mongo-posts/mongo-posts.interface';
import { generateVideoThumbnail } from './video.utils';
import { VIDEO_THUMBNAIL_PATH } from './video.constant';
import { cloudinary } from '../../middlewares/videoMulter';

const uploadVideo = async (
  videoData: IVideoUpload,
  skipCaptionGeneration = false
): Promise<IVideoDocument> => {
  const {
    userId,
    file,
    scheduledDate,
    description,
    tags,
    socialMediaPlatforms,
  } = videoData;

  // Handle scheduling with auto-increment logic
  let finalScheduledDate = null;
  if (scheduledDate) {
    finalScheduledDate = await findNextAvailableDateForContent(
      userId,
      scheduledDate
    );
  }

  // Generate thumbnail
  let thumbnailPath = null;
  let thumbnailCloudinaryPublicId: string | undefined;
  try {
    const thumbnailFilename = `thumb_${Date.now()}_${path.parse(file.filename).name}.jpg`;
    const thumbnailFullPath = path.join(
      VIDEO_THUMBNAIL_PATH,
      thumbnailFilename
    );

    const generatedThumbnail = await generateVideoThumbnail(
      file.path,
      thumbnailFullPath
    );

    if (generatedThumbnail) {
      // If video is uploaded to Cloudinary, upload thumbnail to Cloudinary too
      if (file.path && file.path.startsWith('http')) {
        try {
          const thumbnailUploadResult = await cloudinary.uploader.upload(
            thumbnailFullPath,
            {
              folder: 'kocial-pilot/thumbnails',
              resource_type: 'image',
              public_id: `thumb_${Date.now()}_${path.parse(file.filename).name}`,
            }
          );
          thumbnailPath = thumbnailUploadResult.secure_url;
          thumbnailCloudinaryPublicId = thumbnailUploadResult.public_id;

          // Delete local thumbnail file after uploading to Cloudinary
          if (fs.existsSync(thumbnailFullPath)) {
            fs.unlinkSync(thumbnailFullPath);
          }
        } catch (cloudinaryError) {
          console.error(
            'Failed to upload thumbnail to Cloudinary:',
            cloudinaryError
          );
          // Fallback to local thumbnail
          thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
        }
      } else {
        // Local video, keep thumbnail local
        thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
      }
    }
  } catch (error) {
    console.error('Failed to generate thumbnail for video:', error);
    // Continue without thumbnail - not a critical failure
  }

  // Determine the correct URL based on storage type
  let videoUrl: string;
  let cloudinaryPublicId: string | undefined;

  if (file.path && file.path.startsWith('http')) {
    // Cloudinary upload - use the direct URL
    videoUrl = file.path;
    // Extract public_id from Cloudinary file object
    const cloudinaryFile = file as typeof file & { public_id?: string };
    cloudinaryPublicId = cloudinaryFile.public_id;
  } else {
    // Local file upload - construct local URL
    videoUrl = `/uploads/videos/${file.filename}`;
  }

  const videoDoc = new Video({
    userId,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: videoUrl,
    thumbnail: thumbnailPath,
    scheduledDate: finalScheduledDate,
    isScheduled: !!finalScheduledDate,
    description,
    tags: tags || [],
    socialMediaPlatforms: socialMediaPlatforms || [],
    captionStatus: 'pending',
    cloudinary_public_id: cloudinaryPublicId,
    thumbnail_cloudinary_public_id: thumbnailCloudinaryPublicId,
  });

  const savedVideo = await videoDoc.save();

  // Queue AI caption generation only if not skipped
  if (!skipCaptionGeneration) {
    await queueCaptionGeneration(String(savedVideo._id), file.path, userId);
  }

  return savedVideo;
};

const getAllVideos = async (
  filters: IVideoFilters,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<IVideoDocument[]>> => {
  const { searchTerm, userId, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];

  // Exclude soft-deleted videos by default
  andConditions.push({ isDeleted: { $ne: true } });

  // Add userId filter
  if (userId) {
    andConditions.push({ userId });
  }

  // Add search term
  if (searchTerm) {
    andConditions.push({
      $or: videoSearchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Add other filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      $and: Object.entries(filterData).map(([field, value]) => {
        if (field === 'startDate' || field === 'endDate') {
          const dateFilter: Record<string, unknown> = {};
          if (field === 'startDate') {
            dateFilter.scheduledDate = { $gte: new Date(value as string) };
          }
          if (field === 'endDate') {
            dateFilter.scheduledDate = { $lte: new Date(value as string) };
          }
          return dateFilter;
        }
        return { [field]: value };
      }),
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  } else {
    sortConditions.createdAt = 'desc';
  }

  const result = await Video.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await Video.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getVideoById = async (
  id: string,
  userId: string
): Promise<IVideoDocument | null> => {
  const result = await Video.findOne({
    _id: id,
    userId,
    isDeleted: { $ne: true },
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found');
  }
  return result;
};

const updateVideo = async (
  id: string,
  userId: string,
  payload: IVideoUpdate
): Promise<IVideoDocument | null> => {
  const video = await Video.findOne({ _id: id, userId });
  if (!video) {
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found');
  }

  // Handle scheduled date update
  const updatePayload = { ...payload };
  if (payload.scheduledDate) {
    (updatePayload as any).isScheduled = true; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const result = await Video.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteVideo = async (id: string, userId: string): Promise<void> => {
  console.log(`[DELETE VIDEO] Attempting to delete video with ID: ${id} for user: ${userId}`);
  
  const video = await Video.findOne({ _id: id, userId });
  console.log(`[DELETE VIDEO] Video found:`, video ? 'Yes' : 'No');
  
  if (!video) {
    console.log(`[DELETE VIDEO] Video not found - ID: ${id}, UserID: ${userId}`);
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found');
  }

  // Perform soft delete by setting isDeleted to true and deletedAt timestamp
  const result = await Video.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
  console.log(`[DELETE VIDEO] Video deleted successfully:`, result ? 'Yes' : 'No');
};

// Add hard delete function for permanent removal
const hardDeleteVideo = async (id: string, userId: string): Promise<void> => {
  const video = await Video.findOne({ _id: id, userId });
  if (!video) {
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found');
  }

  // Delete from Cloudinary if it's a Cloudinary video
  if (video.cloudinary_public_id) {
    try {
      await cloudinary.uploader.destroy(video.cloudinary_public_id, {
        resource_type: 'video',
      });
      console.log(
        `✅ Video deleted from Cloudinary: ${video.cloudinary_public_id}`
      );
    } catch (cloudinaryError) {
      console.error('Failed to delete video from Cloudinary:', cloudinaryError);
      // Continue execution even if Cloudinary deletion fails
    }
  } else {
    // Delete local physical file
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }
  }

  // Delete thumbnail if exists
  if (video.thumbnail) {
    if (video.thumbnail_cloudinary_public_id) {
      // Delete thumbnail from Cloudinary
      try {
        await cloudinary.uploader.destroy(
          video.thumbnail_cloudinary_public_id,
          {
            resource_type: 'image',
          }
        );
        console.log(
          `✅ Thumbnail deleted from Cloudinary: ${video.thumbnail_cloudinary_public_id}`
        );
      } catch (cloudinaryError) {
        console.error(
          'Failed to delete thumbnail from Cloudinary:',
          cloudinaryError
        );
      }
    } else {
      // Delete local thumbnail file
      const thumbnailPath = video.thumbnail.startsWith('/uploads')
        ? path.join(process.cwd(), video.thumbnail)
        : video.thumbnail;
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
  }

  await Video.findByIdAndDelete(id);
};

const scheduleVideo = async (
  id: string,
  userId: string,
  scheduledDate: string
): Promise<IVideoDocument | null> => {
  const video = await Video.findOne({ _id: id, userId });
  if (!video) {
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found');
  }

  const result = await Video.findByIdAndUpdate(
    id,
    {
      scheduledDate: new Date(scheduledDate),
      isScheduled: true,
    },
    { new: true, runValidators: true }
  );

  return result;
};

const bulkScheduleVideos = async (
  videoIds: string[],
  userId: string,
  startDate: string
): Promise<IVideoDocument[]> => {
  const videos = await Video.find({ _id: { $in: videoIds }, userId });

  if (videos.length !== videoIds.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Some videos not found');
  }

  // Find available dates starting from the requested start date
  const availableDates = await findAvailableDates(
    userId,
    startDate,
    videoIds.length
  );

  const updates = videoIds.map((videoId, index) => {
    return Video.findByIdAndUpdate(
      videoId,
      {
        scheduledDate: availableDates[index],
        isScheduled: true,
      },
      { new: true, runValidators: true }
    );
  });

  const results = await Promise.all(updates);
  return results.filter(Boolean) as IVideoDocument[];
};

const findNextAvailableDateForContent = async (
  userId: string,
  requestedDate: string
): Promise<Date> => {
  const currentDate = new Date(requestedDate);

  while (true) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check for existing videos
    const existingVideo = await Video.findOne({
      userId,
      scheduledDate: {
        $gte: dayStart,
        $lt: dayEnd,
      },
    });

    // Check for existing posts/images
    const existingPost = await Post.findOne({
      user_id: userId,
      scheduled_date: {
        $gte: dayStart,
        $lt: dayEnd,
      },
    });

    if (!existingVideo && !existingPost) {
      return new Date(currentDate);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
};

// Helper function to find available dates for scheduling
const findAvailableDates = async (
  userId: string,
  startDate: string,
  count: number
): Promise<Date[]> => {
  const availableDates: Date[] = [];
  const currentDate = new Date(startDate);

  // Get all existing scheduled dates for the user
  const existingSchedules = await Video.find({
    userId,
    isScheduled: true,
    scheduledDate: { $gte: currentDate },
  })
    .select('scheduledDate')
    .sort({ scheduledDate: 1 });

  const existingPosts = await Post.find({
    user_id: userId,
    status: 'scheduled',
    scheduled_date: { $gte: currentDate },
  })
    .select('scheduled_date')
    .sort({ scheduled_date: 1 });

  const scheduledDates = new Set([
    ...existingSchedules
      .map((video) =>
        video.scheduledDate ? video.scheduledDate.toDateString() : ''
      )
      .filter(Boolean),
    ...existingPosts
      .map((post: IMongoPost) =>
        post.scheduled_date ? post.scheduled_date.toDateString() : ''
      )
      .filter(Boolean),
  ]);

  // Find available dates
  while (availableDates.length < count) {
    const dateString = currentDate.toDateString();

    // Skip weekends if needed (optional - can be configured)
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

    if (!scheduledDates.has(dateString) && !isWeekend) {
      availableDates.push(new Date(currentDate));
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableDates;
};

// Enhanced scheduling function that respects existing schedules
const scheduleVideoSmart = async (
  id: string,
  userId: string,
  preferredDate: string
): Promise<IVideoDocument | null> => {
  const video = await Video.findOne({ _id: id, userId });
  if (!video) {
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found');
  }

  // Find the next available date starting from preferred date
  const availableDates = await findAvailableDates(userId, preferredDate, 1);

  const result = await Video.findByIdAndUpdate(
    id,
    {
      scheduledDate: availableDates[0],
      isScheduled: true,
    },
    { new: true, runValidators: true }
  );

  return result;
};

const getScheduledVideos = async (
  userId: string
): Promise<IVideoDocument[]> => {
  const result = await Video.find({
    userId,
    isScheduled: true,
    scheduledDate: { $gte: new Date() },
    isDeleted: { $ne: true },
  }).sort({ scheduledDate: 1 });

  return result;
};

const updateCaptionStatus = async (
  videoId: string,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  caption?: string
): Promise<IVideoDocument | null> => {
  const updateData: Partial<IVideoDocument> = { captionStatus: status };
  if (caption) {
    updateData.caption = caption;
  }

  const result = await Video.findByIdAndUpdate(videoId, updateData, {
    new: true,
    runValidators: true,
  });

  return result;
};

// AI Caption Generation Queue using the queue system
const queueCaptionGeneration = async (
  videoId: string,
  videoPath: string,
  userId: string
): Promise<void> => {
  // Add job to the caption generation queue
  await videoCaptionQueue.addJob({
    videoId,
    videoPath,
    userId,
  });
};

// Get recently deleted videos
const getRecentlyDeletedVideos = async (
  filters: IVideoFilters,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<IVideoDocument[]>> => {
  try {
    const { searchTerm, userId, ...filtersData } = filters;
    const andConditions = [];

    // Only get soft-deleted videos
    andConditions.push({ isDeleted: true });

    // Add userId filter
    if (userId) {
      andConditions.push({ userId });
    }

    if (searchTerm) {
      andConditions.push({
        $or: videoSearchableFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      });
    }

    if (Object.keys(filtersData).length) {
      andConditions.push({
        $and: Object.entries(filtersData).map(([field, value]) => ({
          [field]: value,
        })),
      });
    }

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination(paginationOptions);

    const sortConditions: { [key: string]: SortOrder } = {};

    if (sortBy && sortOrder) {
      sortConditions[sortBy] = sortOrder;
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const result = await Video.find(whereConditions)
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  } catch (error) {
    throw new Error(`Error getting recently deleted videos: ${error}`);
  }
};

// Restore video from soft delete
const restoreVideo = async (id: string, userId: string): Promise<void> => {
  const video = await Video.findOne({ _id: id, userId, isDeleted: true });
  if (!video) {
    throw new AppError(httpStatus.NOT_FOUND, 'Video not found in recently deleted');
  }

  await Video.findByIdAndUpdate(id, { 
    isDeleted: false, 
    deletedAt: null 
  });
};

export const VideoService = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  hardDeleteVideo,
  scheduleVideo,
  scheduleVideoSmart,
  bulkScheduleVideos,
  getScheduledVideos,
  updateCaptionStatus,
  queueCaptionGeneration,
  getRecentlyDeletedVideos,
  restoreVideo,
};