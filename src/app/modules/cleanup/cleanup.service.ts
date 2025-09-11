import { Post } from '../mongo-posts/mongo-posts.model';
import { Video } from '../video/video.model';
import { MongoPdf } from '../mongo-pdf/mongo-pdf.model';
import AppError from '../../error/AppError';
import { StatusCodes } from 'http-status-codes';

/**
 * Cleanup service for managing automatic deletion of old soft-deleted content
 */
class CleanupService {
  /**
   * Permanently delete posts that have been soft-deleted for more than 30 days
   */
  static async cleanupOldDeletedPosts(): Promise<{
    deletedPostsCount: number;
    deletedVideosCount: number;
    deletedPdfsCount: number;
  }> {
    try {
      // Calculate the cutoff date (30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log(
        `Starting cleanup for content deleted before: ${thirtyDaysAgo.toISOString()}`
      );

      // Permanently delete posts
      const deletedPostsResult = await Post.deleteMany({
        isDeleted: true,
        deletedAt: { $lt: thirtyDaysAgo },
      });

      // Permanently delete videos
      const deletedVideosResult = await Video.deleteMany({
        isDeleted: true,
        deletedAt: { $lt: thirtyDaysAgo },
      });

      // Permanently delete PDFs
      const deletedPdfsResult = await MongoPdf.deleteMany({
        isDeleted: true,
        deletedAt: { $lt: thirtyDaysAgo },
      });

      const result = {
        deletedPostsCount: deletedPostsResult.deletedCount || 0,
        deletedVideosCount: deletedVideosResult.deletedCount || 0,
        deletedPdfsCount: deletedPdfsResult.deletedCount || 0,
      };

      console.log(`Cleanup completed:`, result);

      return result;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to perform cleanup operation'
      );
    }
  }

  /**
   * Get statistics about content eligible for cleanup
   */
  static async getCleanupStats(): Promise<{
    postsEligibleForCleanup: number;
    videosEligibleForCleanup: number;
    pdfsEligibleForCleanup: number;
    nextCleanupDate: Date;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [postsCount, videosCount, pdfsCount] = await Promise.all([
        Post.countDocuments({
          isDeleted: true,
          deletedAt: { $lt: thirtyDaysAgo },
        }),
        Video.countDocuments({
          isDeleted: true,
          deletedAt: { $lt: thirtyDaysAgo },
        }),
        MongoPdf.countDocuments({
          isDeleted: true,
          deletedAt: { $lt: thirtyDaysAgo },
        }),
      ]);

      // Calculate next cleanup date (tomorrow at midnight)
      const nextCleanupDate = new Date();
      nextCleanupDate.setDate(nextCleanupDate.getDate() + 1);
      nextCleanupDate.setHours(0, 0, 0, 0);

      return {
        postsEligibleForCleanup: postsCount,
        videosEligibleForCleanup: videosCount,
        pdfsEligibleForCleanup: pdfsCount,
        nextCleanupDate,
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get cleanup statistics'
      );
    }
  }

  /**
   * Manual cleanup trigger (for admin use)
   */
  static async triggerManualCleanup(): Promise<{
    success: boolean;
    message: string;
    stats: {
      deletedPostsCount: number;
      deletedVideosCount: number;
      deletedPdfsCount: number;
    };
  }> {
    try {
      const stats = await this.cleanupOldDeletedPosts();

      return {
        success: true,
        message: 'Manual cleanup completed successfully',
        stats,
      };
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      return {
        success: false,
        message: 'Manual cleanup failed',
        stats: {
          deletedPostsCount: 0,
          deletedVideosCount: 0,
          deletedPdfsCount: 0,
        },
      };
    }
  }
}

export { CleanupService };
