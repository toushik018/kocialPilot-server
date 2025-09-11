import { Response } from 'express';
import httpStatus from 'http-status';
import { CustomRequest } from '../../interface/types';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { VideoService } from './video.service';
import pick from '../../utils/pick';
import { videoFilterableFields } from './video.constant';
import { paginationFields } from '../../constants/pagination';

interface RequestWithFile extends CustomRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file?: any;
}

const uploadVideo = catchAsync(async (req: RequestWithFile, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'No video file provided',
      data: null,
    });
  }

  const videoData = {
    userId: req.user?.userId || '',
    file: req.file,
    scheduledDate: req.body.scheduledDate,
    description: req.body.description,
    tags: req.body.tags
      ? typeof req.body.tags === 'string' && !req.body.tags.startsWith('[')
        ? req.body.tags.split(',').map((tag: string) => tag.trim())
        : JSON.parse(req.body.tags)
      : [],
    socialMediaPlatforms: req.body.socialMediaPlatforms
      ? JSON.parse(req.body.socialMediaPlatforms)
      : [],
  };

  const result = await VideoService.uploadVideo(videoData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Video uploaded successfully',
    data: result,
  });
});

const getAllVideos = catchAsync(async (req: CustomRequest, res: Response) => {
  const filters = pick(req.query, videoFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  // Add userId to filters
  filters.userId = req.user?.userId || '';

  const result = await VideoService.getAllVideos(filters, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Videos retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getVideoById = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId || '';

  const result = await VideoService.getVideoById(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video retrieved successfully',
    data: result,
  });
});

const updateVideo = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId || '';

  const result = await VideoService.updateVideo(id, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video updated successfully',
    data: result,
  });
});

const deleteVideo = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId || '';

  await VideoService.deleteVideo(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video deleted successfully',
    data: null,
  });
});

const scheduleVideo = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId || '';
  const { scheduledDate } = req.body;

  const result = await VideoService.scheduleVideo(id, userId, scheduledDate);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video scheduled successfully',
    data: result,
  });
});

const scheduleVideoSmart = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { preferredDate } = req.body;

    const result = await VideoService.scheduleVideoSmart(
      id,
      userId,
      preferredDate
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Video scheduled intelligently to next available date',
      data: result,
    });
  }
);

const bulkScheduleVideos = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.userId || '';
    const { videoIds, startDate } = req.body;

    const result = await VideoService.bulkScheduleVideos(
      videoIds,
      userId,
      startDate
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Videos scheduled successfully',
      data: result,
    });
  }
);

const getScheduledVideos = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.userId || '';

    const result = await VideoService.getScheduledVideos(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Scheduled videos retrieved successfully',
      data: result,
    });
  }
);

const updateCaptionStatus = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const { captionStatus, caption } = req.body;

    const result = await VideoService.updateCaptionStatus(
      id,
      captionStatus as 'pending' | 'generating' | 'completed' | 'failed',
      caption
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Caption status updated successfully',
      data: result,
    });
  }
);

const uploadVideoWithCaption = catchAsync(
  async (req: RequestWithFile, res: Response) => {
    if (!req.file) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'No video file provided',
        data: null,
      });
    }

    const { style = 'engaging', platform = 'instagram' } = req.body;
    const userId = req.user?.userId || '';

    try {
      // Upload video first
      const videoData = {
        userId,
        file: req.file,
        scheduledDate: req.body.scheduledDate,
        description: req.body.description,
        tags: req.body.tags
          ? Array.isArray(req.body.tags)
            ? req.body.tags
            : typeof req.body.tags === 'string' && req.body.tags.startsWith('[')
              ? JSON.parse(req.body.tags)
              : typeof req.body.tags === 'string'
                ? req.body.tags.split(',').map((tag: string) => tag.trim())
                : [req.body.tags]
          : [],
        socialMediaPlatforms: req.body.socialMediaPlatforms
          ? Array.isArray(req.body.socialMediaPlatforms)
            ? req.body.socialMediaPlatforms
            : typeof req.body.socialMediaPlatforms === 'string' &&
                req.body.socialMediaPlatforms.startsWith('[')
              ? JSON.parse(req.body.socialMediaPlatforms)
              : [req.body.socialMediaPlatforms]
          : [],
      };

      const uploadedVideo = await VideoService.uploadVideo(videoData, true); // Skip caption generation to avoid duplicates

      // For Cloudinary uploads with async processing, queue caption generation
      // instead of trying to process immediately
      if (uploadedVideo.path && uploadedVideo.path.startsWith('http')) {
        // Cloudinary upload - queue for later processing
        await VideoService.updateCaptionStatus(
          String(uploadedVideo._id),
          'pending' as const
        );

        // Queue caption generation with delay to allow Cloudinary processing
        setTimeout(async () => {
          try {
            const { AIService } = await import('../ai/ai.service');
            const { AIContextService } = await import(
              '../ai/ai.context.service'
            );

            // Get user context for personalized caption generation
            const userContext =
              await AIContextService.getUserContextForAI(userId);

            const captionResult = await AIService.generateVideoCaption(
              uploadedVideo.path,
              {
                duration: uploadedVideo.duration,
                filename: uploadedVideo.originalName,
                description: uploadedVideo.description,
                thumbnailPath: uploadedVideo.thumbnail,
              },
              userContext
            );

            await VideoService.updateCaptionStatus(
              String(uploadedVideo._id),
              'completed' as const,
              captionResult.caption,
              captionResult.hashtags
            );
          } catch (error) {
            console.error('Failed to generate caption for video:', error);
            await VideoService.updateCaptionStatus(
              String(uploadedVideo._id),
              'failed' as const
            );
          }
        }, 30000); // Wait 30 seconds for Cloudinary processing
      } else {
        // Local upload - process immediately
        try {
          const { AIService } = await import('../ai/ai.service');
          const { AIContextService } = await import('../ai/ai.context.service');

          // Get user context for personalized caption generation
          const userContext =
            await AIContextService.getUserContextForAI(userId);

          const captionResult = await AIService.generateVideoCaption(
            uploadedVideo.path,
            {
              duration: uploadedVideo.duration,
              filename: uploadedVideo.originalName,
              description: uploadedVideo.description,
              thumbnailPath: uploadedVideo.thumbnail,
            },
            userContext
          );

          await VideoService.updateCaptionStatus(
            String(uploadedVideo._id),
            'completed' as const,
            captionResult.caption,
            captionResult.hashtags
          );
        } catch (error) {
          console.error('Failed to generate caption for video:', error);
          await VideoService.updateCaptionStatus(
            String(uploadedVideo._id),
            'failed' as const
          );
        }
      }

      // Determine response based on processing type
      const isCloudinaryUpload =
        uploadedVideo.path && uploadedVideo.path.startsWith('http');

      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: isCloudinaryUpload
          ? 'Video uploaded successfully. Caption generation is in progress.'
          : 'Video uploaded with caption successfully',
        data: {
          video: {
            id: String(uploadedVideo._id),
            filename: uploadedVideo.filename,
            original_filename: uploadedVideo.originalName,
            file_path: uploadedVideo.path,
            file_size: uploadedVideo.size,
            mime_type: uploadedVideo.mimetype,
            duration: uploadedVideo.duration,
            thumbnail: uploadedVideo.thumbnail,
            created_at: uploadedVideo.createdAt,
            caption_status: uploadedVideo.captionStatus,
          },
          caption: isCloudinaryUpload
            ? {
                status: 'pending',
                message:
                  'Caption generation will complete in approximately 30 seconds',
              }
            : {
                text: uploadedVideo.caption || '',
                style,
                platform,
                status: 'completed',
              },
        },
      });
    } catch (error) {
      console.error('Error uploading video with caption:', error);
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to upload video with caption',
        data: null,
      });
    }
  }
);

const getCaptionStatus = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const video = await VideoService.getVideoById(id, userId);

    if (!video) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Video not found',
        data: null,
      });
    }

    // Map caption status to frontend expected values
    let status: 'processing' | 'completed' | 'failed' = 'processing';
    if (video.captionStatus === 'completed') {
      status = 'completed';
    } else if (video.captionStatus === 'failed') {
      status = 'failed';
    } else if (
      video.captionStatus === 'pending' ||
      video.captionStatus === 'generating'
    ) {
      status = 'processing';
    }

    const progress =
      status === 'processing' ? 50 : status === 'completed' ? 100 : 0;

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Caption status retrieved successfully',
      data: {
        videoId: id,
        status,
        caption: video.caption,
        progress,
      },
    });
  }
);

const getRecentlyDeletedVideos = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const filters = pick(req.query, videoFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);
    const userId = req.user?.userId || '';

    const result = await VideoService.getRecentlyDeletedVideos(
      { ...filters, userId },
      paginationOptions
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Recently deleted videos retrieved successfully',
      data: result,
    });
  }
);

const restoreVideo = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId || '';

  await VideoService.restoreVideo(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video restored successfully',
    data: null,
  });
});

const permanentlyDeleteVideo = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    await VideoService.hardDeleteVideo(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Video permanently deleted successfully',
      data: null,
    });
  }
);

export const VideoController = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  scheduleVideo,
  scheduleVideoSmart,
  bulkScheduleVideos,
  getScheduledVideos,
  updateCaptionStatus,
  getCaptionStatus,
  uploadVideoWithCaption,
  getRecentlyDeletedVideos,
  restoreVideo,
  permanentlyDeleteVideo,
};
