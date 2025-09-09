import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { SUPPORTED_VIDEO_FORMATS, MAX_VIDEO_SIZE } from './video.constant';

/**
 * Check if the uploaded file is a valid video format
 */
export const isValidVideoFormat = (mimetype: string): boolean => {
  return SUPPORTED_VIDEO_FORMATS.includes(mimetype);
};

/**
 * Check if the video file size is within limits
 */
export const isValidVideoSize = (size: number): boolean => {
  return size <= MAX_VIDEO_SIZE;
};

/**
 * Generate a unique filename for the video
 */
export const generateVideoFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `video_${timestamp}_${randomString}${extension}`;
};

/**
 * Get video duration (placeholder - implement with actual video processing library)
 */
export const getVideoDuration = async (
  _videoPath: string
): Promise<number | null> => {
  try {
    // This is a placeholder - implement with ffprobe or similar
    // For now, return null to indicate duration is not available
    return null;
  } catch (error) {
    console.error('Error getting video duration:', error);
    return null;
  }
};

/**
 * Generate video thumbnail using ffmpeg
 */
export const generateVideoThumbnail = async (
  videoPath: string,
  outputPath: string
): Promise<string | null> => {
  console.log(`Starting thumbnail generation for: ${videoPath}`);
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('start', (commandLine) => {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .screenshots({
          timestamps: ['50%'], // Take screenshot at 50% of video duration
          filename: path.basename(outputPath),
          folder: outputDir,
          size: '320x240', // Standard thumbnail size
        })
        .on('end', () => {
          console.log('Thumbnail generated successfully:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error generating video thumbnail:', err.message);
          console.error('ffmpeg stdout:', stdout);
          console.error('ffmpeg stderr:', stderr);
          reject(err);
        });
    });
  } catch (error) {
    console.error('Caught exception in generateVideoThumbnail:', error);
    return null;
  }
};

/**
 * Clean up video files (video and thumbnail)
 */
export const cleanupVideoFiles = (
  videoPath: string,
  thumbnailPath?: string
): void => {
  try {
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  } catch (error) {
    console.error('Error cleaning up video files:', error);
  }
};

/**
 * Format video file size for display
 */
export const formatVideoSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format video duration for display (seconds to HH:MM:SS)
 */
export const formatVideoDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Validate video upload data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateVideoUpload = (
  file: any
): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (!isValidVideoFormat(file.mimetype)) {
    return { isValid: false, error: 'Invalid video format' };
  }

  if (!isValidVideoSize(file.size)) {
    return {
      isValid: false,
      error: `File size exceeds limit of ${formatVideoSize(MAX_VIDEO_SIZE)}`,
    };
  }

  return { isValid: true };
};

/**
 * Extract video metadata (placeholder)
 */
export const extractVideoMetadata = async (
  _videoPath: string
): Promise<{
  duration?: number;
  width?: number;
  height?: number;
  bitrate?: number;
}> => {
  try {
    // This is a placeholder - implement with ffprobe or similar
    return {};
  } catch (error) {
    console.error('Error extracting video metadata:', error);
    return {};
  }
};
