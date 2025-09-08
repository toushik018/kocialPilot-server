import { Post as MongoPost } from '../mongo-posts/mongo-posts.model';
import { Video } from '../video/video.model';
import { IDashboardStats } from './dashboard.interface';

const getStats = async (): Promise<IDashboardStats> => {
  // Get total posts count
  const totalPosts = await MongoPost.countDocuments();

  // Get published posts count
  const publishedPosts = await MongoPost.countDocuments({
    status: 'published',
  });

  // Get scheduled posts count
  const scheduledPosts = await MongoPost.countDocuments({
    status: 'scheduled',
  });

  // Get draft posts count
  const draftPosts = await MongoPost.countDocuments({ status: 'draft' });

  // Get image posts count (posts with image_url but no video_url)
  const totalImages = await MongoPost.countDocuments({
    image_url: { $exists: true, $ne: null },
    video_url: { $exists: false }
  });

  // Get video posts count (posts with video_url)
  const videoPostsCount = await MongoPost.countDocuments({
    video_url: { $exists: true, $ne: null }
  });

  // Get standalone videos count from Video collection
  const standaloneVideosCount = await Video.countDocuments();

  // Total videos = video posts + standalone videos
  const totalVideos = videoPostsCount + standaloneVideosCount;

  // Total media = images + videos
  const totalMedia = totalImages + totalVideos;

  // Calculate engagement rate (mock data for now)
  const engagementRate = 0.15;

  // Get recent activity and weekly stats
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get next scheduled post
  const nextScheduledPost = await MongoPost.findOne({
    status: 'scheduled',
    scheduled_date: { $exists: true, $ne: null, $gte: today },
  })
    .sort({ scheduled_date: 1 })
    .lean();

  // Get latest generated caption
  const latestGeneratedPost = await MongoPost.findOne({
    caption: { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Get all posts created in the last 7 days for activity tracking
  const weeklyPosts = await MongoPost.find({
    createdAt: { $gte: sevenDaysAgo },
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

  // Get upcoming scheduled posts for near-term activity
  const upcomingPosts = await MongoPost.find({
    status: 'scheduled',
    scheduled_date: { $exists: true, $ne: null, $gte: today },
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

  // Get platform breakdown
  const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
  const platformBreakdown = await Promise.all(
    platforms.map(async (platform) => ({
      platform,
      count: await MongoPost.countDocuments({ platform }),
    }))
  );

  // Get formatted dates for next scheduled post and last generated caption
  const nextScheduledDate = nextScheduledPost?.scheduled_date
    ? new Date(nextScheduledPost.scheduled_date).toISOString()
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
