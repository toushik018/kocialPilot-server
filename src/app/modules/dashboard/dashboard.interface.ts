export type IDashboardStats = {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
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
