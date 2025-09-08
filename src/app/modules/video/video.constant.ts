export const videoSearchableFields = [
  'originalName',
  'description',
  'tags',
  'caption',
];

export const videoFilterableFields = [
  'searchTerm',
  'userId',
  'captionStatus',
  'isScheduled',
  'isPublished',
  'startDate',
  'endDate',
];

export const VIDEO_CAPTION_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv',
];

export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const VIDEO_UPLOAD_PATH = 'uploads/videos';
export const VIDEO_THUMBNAIL_PATH = 'uploads/thumbnails';

export const AI_CAPTION_QUEUE_NAME = 'video-caption-generation';

export const VIDEO_PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;