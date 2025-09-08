export type IDashboardStats = {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalImages: number;
  totalVideos: number;
  totalMedia: number;
  engagementRate: number;
  recentActivity: {
    date: Date;
    action: string;
    platform: string;
  }[];
  platformBreakdown: {
    platform: string;
    count: number;
  }[];
  nextScheduledDate: string | null;
  lastGeneratedDate: string | null;
};
