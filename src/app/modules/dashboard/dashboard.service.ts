import { Post as MongoPost } from '../mongo-posts/mongo-posts.model';
import { Video } from '../video/video.model';
import { IDashboardStats } from './dashboard.interface';

const getStats = async (): Promise<IDashboardStats> => {
  // Get total posts count (excluding deleted)
  const totalPosts = await MongoPost.countDocuments({
    isDeleted: { $ne: true },
  });

  // Get published posts count (excluding deleted)
  const publishedPosts = await MongoPost.countDocuments({
    status: 'published',
    isDeleted: { $ne: true },
  });

  // Get scheduled posts count (excluding deleted)
  const scheduledPostsCount = await MongoPost.countDocuments({
    status: 'scheduled',
    isDeleted: { $ne: true },
  });

  // Get scheduled videos count (excluding deleted)
  const scheduledVideosCount = await Video.countDocuments({
    isScheduled: true,
    isDeleted: { $ne: true },
  });

  // Total scheduled items = scheduled posts + scheduled videos
  const scheduledPosts = scheduledPostsCount + scheduledVideosCount;

  // Get draft posts count (excluding deleted)
  const draftPosts = await MongoPost.countDocuments({
    status: 'draft',
    isDeleted: { $ne: true },
  });

  // Get image posts count (posts with image_url but no video_url, excluding deleted)
  const totalImages = await MongoPost.countDocuments({
    image_url: { $exists: true, $ne: null },
    video_url: { $exists: false },
    isDeleted: { $ne: true },
  });

  // Get video posts count (posts with video_url, excluding deleted)
  const videoPostsCount = await MongoPost.countDocuments({
    video_url: { $exists: true, $ne: null },
    isDeleted: { $ne: true },
  });

  // Get standalone videos count from Video collection (excluding deleted)
  const standaloneVideosCount = await Video.countDocuments({
    isDeleted: { $ne: true },
  });

  // Total videos = video posts + standalone videos
  const totalVideos = videoPostsCount + standaloneVideosCount;

  // Total media = images + videos
  const totalMedia = totalImages + totalVideos;

  // Get total captions count (posts with captions + videos with captions, excluding deleted)
  const postCaptionsCount = await MongoPost.countDocuments({
    caption: { $exists: true, $nin: [null, ''] },
    isDeleted: { $ne: true },
  });

  const videoCaptionsCount = await Video.countDocuments({
    caption: { $exists: true, $nin: [null, ''] },
    isDeleted: { $ne: true },
  });

  const totalCaptions = postCaptionsCount + videoCaptionsCount;

  // Calculate engagement rate (mock data for now)
  const engagementRate = 0.15;

  // Get recent activity and weekly stats
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get next scheduled post (excluding deleted)
  const nextScheduledPost = await MongoPost.findOne({
    status: 'scheduled',
    scheduled_date: { $exists: true, $ne: null, $gte: today },
    isDeleted: { $ne: true },
  })
    .sort({ scheduled_date: 1 })
    .lean();

  // Get next scheduled video (excluding deleted)
  const nextScheduledVideo = await Video.findOne({
    isScheduled: true,
    scheduledDate: { $exists: true, $ne: null, $gte: today },
    isDeleted: { $ne: true },
  })
    .sort({ scheduledDate: 1 })
    .lean();

  // Find the earliest scheduled date between posts and videos
  let earliestScheduledDate: Date | null = null;
  if (nextScheduledPost && nextScheduledVideo) {
    const postDate = nextScheduledPost.scheduled_date ? new Date(nextScheduledPost.scheduled_date) : null;
    const videoDate = nextScheduledVideo.scheduledDate ? new Date(nextScheduledVideo.scheduledDate) : null;
    if (postDate && videoDate) {
      earliestScheduledDate = postDate <= videoDate ? postDate : videoDate;
    } else if (postDate) {
      earliestScheduledDate = postDate;
    } else if (videoDate) {
      earliestScheduledDate = videoDate;
    }
  } else if (nextScheduledPost && nextScheduledPost.scheduled_date) {
    earliestScheduledDate = new Date(nextScheduledPost.scheduled_date);
  } else if (nextScheduledVideo && nextScheduledVideo.scheduledDate) {
    earliestScheduledDate = new Date(nextScheduledVideo.scheduledDate);
  }

  // Get latest generated caption (excluding deleted)
  const latestGeneratedPost = await MongoPost.findOne({
    caption: { $exists: true, $ne: null },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Get all posts created in the last 7 days for activity tracking (excluding deleted)
  const weeklyPosts = await MongoPost.find({
    createdAt: { $gte: sevenDaysAgo },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Transform posts into activity data
  const weeklyActivities = weeklyPosts.map((post) => ({
    date: post.createdAt ? new Date(post.createdAt) : new Date(),
    action:
      post.status === 'published'
        ? 'Published'
        : post.status === 'scheduled'
          ? 'Scheduled'
          : 'Drafted',
    platform: post.platform || 'Unknown',
  }));

  // Get upcoming scheduled posts for near-term activity (excluding deleted)
  const upcomingPosts = await MongoPost.find({
    status: 'scheduled',
    scheduled_date: { $exists: true, $ne: null, $gte: today },
    isDeleted: { $ne: true },
  })
    .sort({ scheduled_date: 1 })
    .limit(5)
    .lean();

  // Add upcoming posts to activity
  const upcomingActivities = upcomingPosts
    .filter((post) => post.scheduled_date)
    .map((post) => ({
      date: new Date(post.scheduled_date as Date),
      action: 'Scheduled',
      platform: post.platform || 'Unknown',
    }));

  // Combine both activities
  const recentActivity = [...weeklyActivities, ...upcomingActivities]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  // Get platform breakdown (excluding deleted)
  const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
  const platformBreakdown = await Promise.all(
    platforms.map(async (platform) => ({
      platform,
      count: await MongoPost.countDocuments({
        platform,
        isDeleted: { $ne: true },
      }),
    }))
  );

  // Get formatted dates for next scheduled item and last generated caption
  const nextScheduledDate = earliestScheduledDate
    ? earliestScheduledDate.toISOString()
    : null;
  const lastGeneratedDate = latestGeneratedPost?.createdAt
    ? new Date(latestGeneratedPost.createdAt).toISOString()
    : null;

  return {
    totalPosts,
    publishedPosts,
    scheduledPosts,
    draftPosts,
    totalImages,
    totalVideos,
    totalMedia,
    totalCaptions,
    engagementRate,
    recentActivity,
    platformBreakdown,
    nextScheduledDate,
    lastGeneratedDate,
  };
};

export const DashboardService = {
  getStats,
};
