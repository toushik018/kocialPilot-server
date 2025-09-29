import { Post } from '../mongo-posts/mongo-posts.model';
import { VideoService } from '../video/video.service';

export const CalendarService = {
  async getCalendarData(year: number, month: number, userId?: string) {
    // Compute month start/end
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Query posts for the month for this user
    const posts = await Post.find({
      ...(userId ? { user_id: userId } : {}),
      $or: [
        {
          status: 'scheduled',
          scheduled_date: { $gte: startDate, $lte: endDate },
        },
        { createdAt: { $gte: startDate, $lte: endDate } },
      ],
    });

    const videosResult = await VideoService.getAllVideos(
      {
        userId: userId || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      { page: 1, limit: 1000 }
    );

    return { posts, videos: videosResult.data || [] };
  },

  async getPostsByDateRange(startDate: Date, endDate: Date) {
    return Post.find({
      $or: [
        {
          status: 'scheduled',
          scheduled_date: { $gte: startDate, $lte: endDate },
        },
        { status: 'published', createdAt: { $gte: startDate, $lte: endDate } },
      ],
    });
  },
};
