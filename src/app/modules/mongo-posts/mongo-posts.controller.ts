import { Response } from 'express';
import httpStatus from 'http-status';
import { paginationFields } from '../../constants/pagination';
import { catchAsync } from '../../utils/catchAsync';
import pick from '../../utils/pick';
import { sendResponse } from '../../utils/sendResponse';
import { IMongoPost } from './mongo-posts.interface';
import { Post } from './mongo-posts.model';
import { MongoPostService } from './mongo-posts.service';
import { VideoService } from '../video/video.service';
import { CustomRequest } from '../../interface/types';

import { Express } from 'express';

interface RequestWithFile extends CustomRequest {
  file?: Express.Multer.File;
}

interface CalendarData {
  posts: {
    id: string;
    user_id: string;
    image_url?: string;
    video_url?: string;
    caption?: string;
    hashtags?: string[];
    metadata?: Record<string, unknown>;
    scheduled_date?: string;
    scheduled_time?: string;
    status: string;
    auto_scheduled: boolean;
    created_at: string;
    updated_at: string;
    posted_at?: string;
    content_type: 'image' | 'video';
  }[];
  total_count: number;
}

const createPost = catchAsync(async (req: CustomRequest, res: Response) => {
  try {
    console.log('📝 Creating post with data:', req.body);
    console.log('👤 User info:', {
      userId: req.user?.userId,
      email: req.user?.email,
      username: req.user?.username,
    });

    const postData = req.body as IMongoPost;

    // Validate image URL format to prevent duplicates from AI upload
    if (postData.image_url) {
      // Check if this is an invalid local path format for Cloudinary images
      if (
        postData.image_url.startsWith('/uploads/') &&
        !postData.image_url.includes('/images/')
      ) {
        console.log(
          '🚫 Detected invalid image URL format, likely from AI upload. Skipping duplicate post creation.'
        );
        return sendResponse(res, {
          statusCode: httpStatus.CONFLICT,
          success: false,
          message: 'Post already created through AI upload process',
        });
      }
    }

    // Get user info from auth middleware
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    const username = req.user?.username || userEmail?.split('@')[0] || '';

    if (!userId || !userEmail) {
      console.error('❌ User authentication failed');
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    // Add user info to post data
    const postWithUserData = {
      ...postData,
      user_id: userId,
      email: userEmail,
      username: username,
    };

    console.log('🚀 Creating post with final data:', postWithUserData);
    const result = await MongoPostService.createPost(postWithUserData);
    console.log('✅ Post created successfully:', result._id);

    sendResponse<IMongoPost>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Post created successfully',
      data: result,
    });
  } catch (error) {
    console.error('❌ Error in createPost controller:', error);
    throw error; // Re-throw to be handled by catchAsync
  }
});

const uploadImagePost = catchAsync(
  async (req: RequestWithFile, res: Response) => {
    // Get the uploaded file from multer
    const file = req.file;
    if (!file) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'No image file uploaded',
      });
    }

    // Get user info from auth middleware
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    const username = req.user?.username || '';

    if (!userId || !userEmail) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    // Get post data from request body
    const postData = req.body as Partial<IMongoPost>;

    // Create post with image
    const result = await MongoPostService.createPostWithImage(
      file,
      postData,
      userId,
      userEmail,
      username
    );

    sendResponse<IMongoPost>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Image uploaded and post created successfully',
      data: result,
    });
  }
);

const getAllPosts = catchAsync(async (req: CustomRequest, res: Response) => {
  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'status',
    'platform',
  ]);
  const paginationOptions = pick(req.query, paginationFields);

  // Get user ID from auth middleware
  const userId = req.user?.userId;

  // Get posts from mongo-posts with userId filtering
  const result = await MongoPostService.getAllPosts(
    filters,
    paginationOptions,
    userId
  );

  // Get videos from video service with proper filters
  const videoFilters = {
    searchTerm:
      typeof filters.searchTerm === 'string' ? filters.searchTerm : undefined,
    userId: userId,
  };
  const videoResult = await VideoService.getAllVideos(videoFilters, {
    page: 1,
    limit: 1000,
  });

  // Transform posts
  const transformedPosts = result.data.map((post) => ({
    id: post._id?.toString() || '',
    user_id: post.user_id,
    image_url: post.image_url,
    video_url: undefined,
    caption: post.caption,
    hashtags: post.hashtags || [],
    metadata: post.metadata,
    scheduled_date: post.scheduled_date
      ? new Date(post.scheduled_date).toISOString()
      : '',
    scheduled_time: post.scheduled_time,
    status: post.status,
    auto_scheduled: post.auto_scheduled || false,
    created_at: post.createdAt
      ? new Date(post.createdAt).toISOString()
      : new Date().toISOString(),
    updated_at: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : new Date().toISOString(),
    posted_at: undefined, // Not in the schema
  }));

  // Transform videos to match post structure
  const transformedVideos = videoResult.data.map((video) => ({
    id: video._id?.toString() || '',
    user_id: video.userId,
    image_url: undefined,
    video_url: video.url,
    thumbnail: video.thumbnail,
    content_type: 'video',
    caption: video.caption || video.description || '',
    hashtags: video.tags || [],
    metadata: {
      filename: video.filename,
      originalName: video.originalName,
      mimetype: video.mimetype,
      size: video.size,
      captionStatus: video.captionStatus,
      socialMediaPlatforms: video.socialMediaPlatforms,
    },
    scheduled_date: video.scheduledDate
      ? new Date(video.scheduledDate).toISOString()
      : '',
    scheduled_time: video.scheduledDate
      ? new Date(video.scheduledDate)
          .toTimeString()
          .split(' ')[0]
          .substring(0, 5)
      : '',
    status: video.isScheduled ? 'scheduled' : 'draft',
    auto_scheduled: false,
    created_at: video.createdAt
      ? new Date(video.createdAt).toISOString()
      : new Date().toISOString(),
    updated_at: video.updatedAt
      ? new Date(video.updatedAt).toISOString()
      : new Date().toISOString(),
    posted_at: undefined,
  }));

  // Combine posts and videos
  const allContent = [...transformedPosts, ...transformedVideos];

  // Sort by created_at descending
  allContent.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Apply pagination to combined results
  const currentPage = Number(paginationOptions.page) || 1;
  const currentLimit = Number(paginationOptions.limit) || 12;
  const startIndex = (currentPage - 1) * currentLimit;
  const endIndex = startIndex + currentLimit;
  const paginatedContent = allContent.slice(startIndex, endIndex);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts and videos retrieved successfully',
    data: paginatedContent,
    meta: {
      page: currentPage,
      limit: currentLimit,
      total: allContent.length,
    },
  });
});

const getDraftPosts = catchAsync(async (req: CustomRequest, res: Response) => {
  const result = await MongoPostService.getDraftPosts();

  // Transform the response to match frontend expectations
  const transformedPosts = result.map((post) => ({
    id: post._id?.toString() || '',
    user_id: post.user_id,
    image_url: post.image_url,
    caption: post.caption,
    hashtags: post.hashtags || [],
    alt_text: post.alt_text,
    metadata: post.metadata,
    scheduled_date: post.scheduled_date
      ? new Date(post.scheduled_date).toISOString()
      : undefined,
    scheduled_time: post.scheduled_time,
    status: post.status,
    auto_scheduled: post.auto_scheduled || false,
    created_at: post.createdAt
      ? new Date(post.createdAt).toISOString()
      : new Date().toISOString(),
    updated_at: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : new Date().toISOString(),
    posted_at: undefined, // Not in the schema
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Draft posts retrieved successfully',
    data: transformedPosts,
  });
});

const getPostById = catchAsync(async (req: CustomRequest, res: Response) => {
  const id = req.params.id;
  const result = await MongoPostService.getPostById(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Post not found',
    });
  }

  sendResponse<IMongoPost>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post retrieved successfully',
    data: result,
  });
});

const updatePost = catchAsync(async (req: CustomRequest, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body as Partial<IMongoPost>;

  const result = await MongoPostService.updatePost(id, updatedData);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Post not found',
    });
  }

  sendResponse<IMongoPost>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post updated successfully',
    data: result,
  });
});

const deletePost = catchAsync(async (req: CustomRequest, res: Response) => {
  const id = req.params.id;

  const result = await MongoPostService.deletePost(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Post not found',
    });
  }

  sendResponse<IMongoPost>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post deleted successfully',
    data: result,
  });
});

const getCalendarPosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Get both posts and videos for the calendar
    const userId = req.user?.userId;
    const posts = await MongoPostService.getCalendarPosts(year, month, userId);

    // Get videos for the same time period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const videoFilters = {
      userId: req.user?.userId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    const videosResult = await VideoService.getAllVideos(videoFilters, {
      page: 1,
      limit: 1000,
    });
    const videos = videosResult.data || [];

    // Transform the response to match frontend expectations
    const postsByDate: Record<string, CalendarData> = {};

    // Process posts
    posts.forEach((post) => {
      const dateKey = post.scheduled_date
        ? new Date(post.scheduled_date).toISOString().split('T')[0]
        : post.createdAt
          ? new Date(post.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = {
          posts: [],
          total_count: 0,
        };
      }

      postsByDate[dateKey].posts.push({
        id: post._id?.toString() || '',
        user_id: post.user_id,
        image_url: post.image_url,
        caption: post.caption,
        hashtags: post.hashtags || [],
        metadata: post.metadata,
        scheduled_date: post.scheduled_date
          ? new Date(post.scheduled_date).toISOString()
          : undefined,
        scheduled_time: post.scheduled_time,
        status: post.status,
        auto_scheduled: post.auto_scheduled || false,
        created_at: post.createdAt
          ? new Date(post.createdAt).toISOString()
          : new Date().toISOString(),
        updated_at: post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : new Date().toISOString(),
        posted_at: undefined,
        content_type: 'image' as const,
      });
    });

    // Process videos
    videos.forEach((video) => {
      const dateKey = video.scheduledDate
        ? new Date(video.scheduledDate).toISOString().split('T')[0]
        : video.createdAt
          ? new Date(video.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = {
          posts: [],
          total_count: 0,
        };
      }

      postsByDate[dateKey].posts.push({
        id: video._id?.toString() || '',
        user_id: video.userId,
        video_url: video.url,
        content_type: 'video' as const,
        caption: video.caption || video.description,
        hashtags: video.tags || [],
        metadata: {
          filename: video.filename,
          originalName: video.originalName,
          mimetype: video.mimetype,
          size: video.size,
          captionStatus: video.captionStatus,
          socialMediaPlatforms: video.socialMediaPlatforms,
        },
        scheduled_date: video.scheduledDate
          ? new Date(video.scheduledDate).toISOString()
          : undefined,
        scheduled_time: video.scheduledDate
          ? new Date(video.scheduledDate)
              .toTimeString()
              .split(' ')[0]
              .substring(0, 5)
          : undefined,
        status: video.isScheduled ? 'scheduled' : 'draft',
        auto_scheduled: false,
        created_at: video.createdAt
          ? new Date(video.createdAt).toISOString()
          : new Date().toISOString(),
        updated_at: video.updatedAt
          ? new Date(video.updatedAt).toISOString()
          : new Date().toISOString(),
        posted_at: undefined,
      });
    });

    // Update total counts for each date
    Object.keys(postsByDate).forEach((dateKey) => {
      postsByDate[dateKey].total_count = postsByDate[dateKey].posts.length;
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Calendar posts and videos retrieved successfully',
      data: {
        calendar_data: postsByDate,
      },
    });
  }
);

const getPostsByDate = catchAsync(async (req: CustomRequest, res: Response) => {
  const date = req.params.date;

  // Create start and end of day dates
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Find posts for the specific date
  const result = await Post.find({
    $or: [
      {
        status: 'scheduled',
        scheduled_date: { $gte: startDate, $lte: endDate },
      },
      {
        status: 'published',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    ],
  });

  // Transform the response to match frontend expectations
  const posts = result.map((post) => ({
    _id: post._id?.toString() || '',
    image_url: post.image_url,
    caption: post.caption,
    scheduled_date: post.scheduled_date
      ? new Date(post.scheduled_date).toISOString()
      : '',
    scheduled_time: post.scheduled_time,
    hashtags: post.hashtags || [],
    status: post.status,
    title: post.caption.substring(0, 50), // Use first 50 chars of caption as title
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts retrieved successfully',
    data: {
      posts: posts,
    },
  });
});

const getOptimalScheduleTime = catchAsync(
  async (req: CustomRequest, res: Response) => {
    try {
      // Get user ID from auth middleware
      const userId = req.user?.userId;
      if (!userId) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          success: false,
          message: 'User authentication required',
        });
      }

      // Get user's schedule preference
      const userSchedule = await MongoPostService.getUserSchedule(userId);

      // Get the latest scheduled post for this user
      const latestPost = await Post.findOne({
        user_id: userId,
        status: 'scheduled',
      }).sort({ scheduled_date: -1 });

      let scheduledDate = new Date();
      let scheduledTime = '09:00'; // Default time

      // If user has a schedule preference, use it
      if (userSchedule) {
        scheduledTime = userSchedule.time;

        // If there's a latest post, schedule after it
        if (latestPost && latestPost.scheduled_date) {
          scheduledDate = new Date(latestPost.scheduled_date);
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        } else {
          // Set to next day with user's preferred time
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
      } else {
        // No user schedule, just schedule for tomorrow
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      // Format the time properly
      scheduledDate.setHours(parseInt(scheduledTime.split(':')[0]) || 9);
      scheduledDate.setMinutes(parseInt(scheduledTime.split(':')[1]) || 0);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Optimal schedule time calculated successfully',
        data: {
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledTime,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to calculate optimal schedule time';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

// Add the missing controller methods
const reschedulePost = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { scheduled_date, scheduled_time } = req.body;

  try {
    // Validate date and time
    if (!scheduled_date || !scheduled_time) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Scheduled date and time are required',
      });
    }

    // Update the post with new schedule information
    const result = await MongoPostService.updatePost(id, {
      scheduled_date: new Date(scheduled_date),
      scheduled_time,
      status: 'scheduled',
    });

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Post not found',
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Post rescheduled successfully',
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to reschedule post';
    sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: errorMessage,
    });
  }
});

const scheduleDraftPosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { postIds, scheduled_date, scheduled_time } = req.body;

    try {
      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Post IDs are required',
        });
      }

      if (!scheduled_date || !scheduled_time) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Scheduled date and time are required',
        });
      }

      // Update multiple posts
      const updatedPosts = [];
      const errors = [];

      for (const id of postIds) {
        try {
          const result = await MongoPostService.updatePost(id, {
            scheduled_date: new Date(scheduled_date),
            scheduled_time,
            status: 'scheduled',
          });

          if (result) {
            updatedPosts.push(result);
          } else {
            errors.push(`Post with ID ${id} not found`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error updating post ${id}: ${errorMessage}`);
        }
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${updatedPosts.length} posts scheduled successfully`,
        data: {
          updatedPosts,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to schedule draft posts';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

const scheduleSingleDraftPost = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const { scheduled_date, scheduled_time } = req.body;

    try {
      if (!scheduled_date || !scheduled_time) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Scheduled date and time are required',
        });
      }

      // Update the post
      const result = await MongoPostService.updatePost(id, {
        scheduled_date: new Date(scheduled_date),
        scheduled_time,
        status: 'scheduled',
      });

      if (!result) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          success: false,
          message: 'Post not found',
        });
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Post scheduled successfully',
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to schedule post';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

const deleteMultipleDraftPosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { postIds } = req.body;

    try {
      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Post IDs are required',
        });
      }

      // Delete multiple posts
      const deletedPosts = [];
      const errors = [];

      for (const id of postIds) {
        try {
          const result = await MongoPostService.deletePost(id);

          if (result) {
            deletedPosts.push(result);
          } else {
            errors.push(`Post with ID ${id} not found`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error deleting post ${id}: ${errorMessage}`);
        }
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${deletedPosts.length} posts deleted successfully`,
        data: {
          deletedPosts,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete draft posts';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

const deleteSingleDraftPost = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;

    try {
      // Delete the post
      const result = await MongoPostService.deletePost(id);

      if (!result) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          success: false,
          message: 'Post not found',
        });
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Post deleted successfully',
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete post';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

// Get recently deleted posts
const getRecentlyDeletedPosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'status',
      'platform',
    ]);
    const paginationOptions = pick(req.query, paginationFields);
    const userId = req.user?.userId;

    const result = await MongoPostService.getRecentlyDeletedPosts(
      filters,
      paginationOptions,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Recently deleted posts retrieved successfully',
      data: result,
    });
  }
);

// Restore a deleted post
const restorePost = catchAsync(async (req: CustomRequest, res: Response) => {
  const id = req.params.id;

  const result = await MongoPostService.restorePost(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Post not found',
    });
  }

  sendResponse<IMongoPost>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Post restored successfully',
    data: result,
  });
});

// Permanently delete a post
const permanentlyDeletePost = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const id = req.params.id;

    const result = await MongoPostService.permanentlyDeletePost(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Post not found',
      });
    }

    sendResponse<IMongoPost>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Post permanently deleted successfully',
      data: result,
    });
  }
);

// Restore multiple posts
const restoreMultiplePosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { postIds } = req.body;

    try {
      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Post IDs are required',
        });
      }

      const restoredPosts = [];
      const errors = [];

      for (const id of postIds) {
        try {
          const result = await MongoPostService.restorePost(id);

          if (result) {
            restoredPosts.push(result);
          } else {
            errors.push(`Post with ID ${id} not found`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error restoring post ${id}: ${errorMessage}`);
        }
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${restoredPosts.length} posts restored successfully`,
        data: {
          restoredPosts,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to restore posts';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

// Permanently delete multiple posts
const permanentlyDeleteMultiplePosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { postIds } = req.body;

    try {
      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Post IDs are required',
        });
      }

      const deletedPosts = [];
      const errors = [];

      for (const id of postIds) {
        try {
          const result = await MongoPostService.permanentlyDeletePost(id);

          if (result) {
            deletedPosts.push(result);
          } else {
            errors.push(`Post with ID ${id} not found`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error deleting post ${id}: ${errorMessage}`);
        }
      }

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${deletedPosts.length} posts permanently deleted successfully`,
        data: {
          deletedPosts,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to permanently delete posts';
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: errorMessage,
      });
    }
  }
);

export const MongoPostController = {
  createPost,
  uploadImagePost,
  getAllPosts,
  getDraftPosts,
  getPostById,
  updatePost,
  deletePost,
  getCalendarPosts,
  getPostsByDate,
  getOptimalScheduleTime,
  reschedulePost,
  scheduleDraftPosts,
  scheduleSingleDraftPost,
  deleteMultipleDraftPosts,
  deleteSingleDraftPost,
  getRecentlyDeletedPosts,
  restorePost,
  permanentlyDeletePost,
  restoreMultiplePosts,
  permanentlyDeleteMultiplePosts,
};
