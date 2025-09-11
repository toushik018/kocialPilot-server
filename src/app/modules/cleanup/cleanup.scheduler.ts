import { CleanupService } from './cleanup.service';

/**
 * Cleanup scheduler for running automatic cleanup tasks
 */
class CleanupScheduler {
  private static instance: CleanupScheduler;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): CleanupScheduler {
    if (!CleanupScheduler.instance) {
      CleanupScheduler.instance = new CleanupScheduler();
    }
    return CleanupScheduler.instance;
  }

  /**
   * Start the cleanup scheduler
   * Runs cleanup every 24 hours (86400000 milliseconds)
   */
  start(): void {
    if (this.isRunning) {
      console.log('Cleanup scheduler is already running');
      return;
    }

    console.log('Starting cleanup scheduler...');

    // Run cleanup immediately on start
    this.runCleanup();

    // Schedule cleanup to run every 24 hours
    this.intervalId = setInterval(
      () => {
        this.runCleanup();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours in milliseconds

    this.isRunning = true;
    console.log('Cleanup scheduler started successfully');
  }

  /**
   * Stop the cleanup scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Cleanup scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Cleanup scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  getStatus(): { isRunning: boolean; nextRunTime?: Date } {
    const nextRunTime = this.isRunning
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : undefined;
    return {
      isRunning: this.isRunning,
      nextRunTime,
    };
  }

  /**
   * Run the cleanup process
   */
  private async runCleanup(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running scheduled cleanup...`);

      const result = await CleanupService.cleanupOldDeletedPosts();

      console.log(
        `[${new Date().toISOString()}] Scheduled cleanup completed:`,
        result
      );

      // Log summary if any items were deleted
      const totalDeleted =
        result.deletedPostsCount +
        result.deletedVideosCount +
        result.deletedPdfsCount;
      if (totalDeleted > 0) {
        console.log(
          `Cleanup summary: ${totalDeleted} items permanently deleted`
        );
      } else {
        console.log('No items were eligible for cleanup');
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Scheduled cleanup failed:`,
        error
      );
    }
  }
}

// Export singleton instance
export const cleanupScheduler = CleanupScheduler.getInstance();
export { CleanupScheduler };
