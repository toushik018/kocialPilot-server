import { z } from 'zod';

const createVideoValidation = z.object({
  body: z.object({
    scheduledDate: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    socialMediaPlatforms: z.array(z.string()).optional(),
  }),
});

const updateVideoValidation = z.object({
  body: z.object({
    caption: z.string().optional(),
    scheduledDate: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    socialMediaPlatforms: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
  }),
});

const getVideosValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    captionStatus: z
      .enum(['pending', 'generating', 'completed', 'failed'])
      .optional(),
    isScheduled: z.string().optional(),
    isPublished: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

const videoIdValidation = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Video ID is required',
    }),
  }),
});

const scheduleVideoValidation = z.object({
  body: z.object({
    scheduledDate: z.string({
      required_error: 'Scheduled date is required',
    }),
  }),
});

const bulkScheduleValidation = z.object({
  body: z.object({
    videoIds: z.array(z.string()).min(1, 'At least one video ID is required'),
    startDate: z.string({
      required_error: 'Start date is required',
    }),
  }),
});

const scheduleVideoSmartValidation = z.object({
  body: z.object({
    preferredDate: z.string({
      required_error: 'Preferred date is required',
    }),
  }),
});

export const VideoValidation = {
  createVideoValidation,
  updateVideoValidation,
  getVideosValidation,
  videoIdValidation,
  scheduleVideoValidation,
  scheduleVideoSmartValidation,
  bulkScheduleValidation,
};
