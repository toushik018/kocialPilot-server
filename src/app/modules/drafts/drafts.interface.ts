export interface DraftPostItem {
  id: string;
  user_id: string;
  image_url?: string;
  caption: string;
  hashtags: string[];
  alt_text?: string;
  metadata?: Record<string, unknown>;
  scheduled_date?: string;
  scheduled_time?: string;
  status: string;
  auto_scheduled: boolean;
  created_at: string;
  updated_at: string;
}
