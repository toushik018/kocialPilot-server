import { Response } from 'express';
import httpStatus from 'http-status';
import { CustomRequest } from '../../interface/types';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { Post } from '../mongo-posts/mongo-posts.model';
import { CalendarPostItem } from './calendar.interface';
import { CalendarService } from './calendar.service';

// GET /api/v1/calendar/:year/:month
const getCalendarPosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Invalid year or month parameter',
      });
    }

    const userId = req.user?.userId;
    const { posts, videos } = await CalendarService.getCalendarData(
      year,
      month,
      userId
    );

    const postsByDate: Record<
      string,
      { posts: CalendarPostItem[]; total_count: number }
    > = {};

    // Posts
    posts.forEach((post) => {
      const dateKey = post.scheduled_date
        ? new Date(post.scheduled_date).toISOString().split('T')[0]
        : post.createdAt
          ? new Date(post.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      if (!postsByDate[dateKey])
        postsByDate[dateKey] = { posts: [], total_count: 0 };

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

    // Videos
    videos.forEach((video) => {
      const dateKey = video.scheduledDate
        ? new Date(video.scheduledDate).toISOString().split('T')[0]
        : video.createdAt
          ? new Date(video.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      if (!postsByDate[dateKey])
        postsByDate[dateKey] = { posts: [], total_count: 0 };

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

    Object.keys(postsByDate).forEach((dateKey) => {
      postsByDate[dateKey].total_count = postsByDate[dateKey].posts.length;
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Calendar posts and videos retrieved successfully',
      data: { calendar_data: postsByDate },
    });
  }
);

// GET /api/v1/calendar/by-date/:date
const getPostsByDate = catchAsync(async (req: CustomRequest, res: Response) => {
  const dateStr = req.params.date;
  // Validate YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid date format. Expected YYYY-MM-DD',
    });
  }
  const [y, m, d] = dateStr.split('-').map((v) => Number(v));
  const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  const endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid date value',
    });
  }

  const result = await Post.find({
    isDeleted: { $ne: true }, // Exclude deleted posts
    $or: [
      {
        status: 'scheduled',
        scheduled_date: { $gte: startDate, $lte: endDate },
      },
      { status: 'published', createdAt: { $gte: startDate, $lte: endDate } },
    ],
  });

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
    title: post.caption.substring(0, 50),
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Posts retrieved successfully',
    data: { posts },
  });
});

export const CalendarController = {
  getCalendarPosts,
  getPostsByDate,
};
