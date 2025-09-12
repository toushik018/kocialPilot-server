import express from 'express';
import { VideoController } from './video.controller';
import { VideoValidation } from './video.validation';
import { validateRequest } from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { videoUpload } from '../../middlewares/videoMulter';

const router = express.Router();

// Upload video
router.post(
  '/upload',
  auth(),
  videoUpload.single('video'),
  validateRequest(VideoValidation.createVideoValidation),
  VideoController.uploadVideo
);

// Upload video with AI caption generation
router.post(
  '/upload-with-caption',
  auth(),
  videoUpload.single('video'),
  VideoController.uploadVideoWithCaption
);

// Get all videos for authenticated user
router.get(
  '/',
  auth(),
  validateRequest(VideoValidation.getVideosValidation),
  VideoController.getAllVideos
);

// Get scheduled videos
router.get('/scheduled', auth(), VideoController.getScheduledVideos);

// Get recently deleted videos
router.get(
  '/recent-delete',
  auth(),
  validateRequest(VideoValidation.getVideosValidation),
  VideoController.getRecentlyDeletedVideos
);

// Get video by ID
router.get(
  '/:id',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  VideoController.getVideoById
);

// Update video
router.patch(
  '/:id',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  validateRequest(VideoValidation.updateVideoValidation),
  VideoController.updateVideo
);

// Delete video
router.delete(
  '/:id',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  VideoController.deleteVideo
);

// Schedule video
router.patch(
  '/:id/schedule',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  validateRequest(VideoValidation.scheduleVideoValidation),
  VideoController.scheduleVideo
);

// Smart schedule video (finds next available date)
router.patch(
  '/:id/schedule-smart',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  validateRequest(VideoValidation.scheduleVideoSmartValidation),
  VideoController.scheduleVideoSmart
);

// Bulk schedule videos
router.post(
  '/bulk-schedule',
  auth(),
  validateRequest(VideoValidation.bulkScheduleValidation),
  VideoController.bulkScheduleVideos
);

// Update caption status (internal API for AI service)
router.patch(
  '/:id/caption-status',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  VideoController.updateCaptionStatus
);

// Get caption status for real-time updates
router.get(
  '/:id/caption-status',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  VideoController.getCaptionStatus
);

// Restore video from recent delete
router.patch(
  '/recent-delete/:id/restore',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  VideoController.restoreVideo
);

// Permanently delete video from recent delete
router.delete(
  '/recent-delete/:id/permanent',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  VideoController.permanentlyDeleteVideo
);

// Reschedule video
router.patch(
  '/:id/reschedule',
  auth(),
  validateRequest(VideoValidation.videoIdValidation),
  validateRequest(VideoValidation.rescheduleVideoValidation),
  VideoController.rescheduleVideo
);

export const VideoRoutes = router;
