import { AIService } from '../ai/ai.service';
import { AIContextService } from '../ai/ai.context.service';
import { Video } from './video.model';
import { IVideoDocument } from './video.interface';

interface IVideoCaptionJob {
  videoId: string;
  videoPath: string;
  userId: string;
  retryCount?: number;
}

class VideoCaptionQueue {
  private jobs: Map<string, IVideoCaptionJob> = new Map();
  private processing: Set<string> = new Set();
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  /**
   * Add a video caption generation job to the queue
   */
  async addJob(job: IVideoCaptionJob): Promise<void> {
    const jobId = `${job.videoId}-${Date.now()}`;
    this.jobs.set(jobId, { ...job, retryCount: 0 });

    // Process the job immediately (in a real system, this would be handled by workers)
    this.processJob(jobId);
  }

  /**
   * Process a single caption generation job
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || this.processing.has(jobId)) {
      return;
    }

    this.processing.add(jobId);

    try {
      // Update video status to generating
      await this.updateCaptionStatus(job.videoId, 'generating');

      // Get video document to extract metadata
      const video = await Video.findById(job.videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Get user context for personalized caption generation
      const userContext = await AIContextService.getUserContextForAI(
        job.userId
      );

      // Generate AI caption using the AI service with user context
      const captionResult = await AIService.generateVideoCaption(
        job.videoPath,
        {
          filename: video.originalName,
          description: video.description,
          thumbnailPath: video.thumbnail,
          // duration: video.duration, // Add when video duration is implemented
        },
        userContext
      );

      // Update video with generated caption and hashtags separately
      await this.updateCaptionStatus(
        job.videoId,
        'completed',
        captionResult.caption,
        captionResult.hashtags
      );

      // Remove job from queue
      this.jobs.delete(jobId);

      console.log(
        `✅ Video caption generated successfully for video: ${job.videoId}`
      );
    } catch (error) {
      console.error(
        `❌ Error generating video caption for ${job.videoId}:`,
        error
      );

      // Handle retry logic
      const currentRetryCount = job.retryCount || 0;
      if (currentRetryCount < this.maxRetries) {
        job.retryCount = currentRetryCount + 1;
        console.log(
          `🔄 Retrying caption generation for video ${job.videoId} (attempt ${job.retryCount}/${this.maxRetries})`
        );

        // Retry after delay
        setTimeout(() => {
          this.processing.delete(jobId);
          this.processJob(jobId);
        }, this.retryDelay * job.retryCount); // Exponential backoff
      } else {
        // Max retries reached, mark as failed
        await this.updateCaptionStatus(job.videoId, 'failed');
        this.jobs.delete(jobId);
        console.log(
          `💥 Max retries reached for video caption generation: ${job.videoId}`
        );
      }
    } finally {
      this.processing.delete(jobId);
    }
  }

  /**
   * Update video caption status in database
   */
  private async updateCaptionStatus(
    videoId: string,
    status: 'pending' | 'generating' | 'completed' | 'failed',
    caption?: string,
    hashtags?: string[]
  ): Promise<IVideoDocument | null> {
    const updateData: Partial<IVideoDocument> = { captionStatus: status };
    if (caption) {
      updateData.caption = caption;
    }
    if (hashtags) {
      updateData.hashtags = hashtags;
    }

    const result = await Video.findByIdAndUpdate(videoId, updateData, {
      new: true,
      runValidators: true,
    });

    return result;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      totalJobs: this.jobs.size,
      processingJobs: this.processing.size,
      pendingJobs: this.jobs.size - this.processing.size,
    };
  }

  /**
   * Clear all jobs (for testing/cleanup)
   */
  clearJobs(): void {
    this.jobs.clear();
    this.processing.clear();
  }
}

// Export singleton instance
export const videoCaptionQueue = new VideoCaptionQueue();
export { VideoCaptionQueue };
