export interface CalendarPostItem {
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
}

export interface CalendarDataMap {
  [date: string]: {
    posts: CalendarPostItem[];
    total_count: number;
  };
}
