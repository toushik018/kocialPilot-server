import * as cron from 'node-cron';
import { Post } from '../mongo-posts/mongo-posts.model';
import { SocialMediaAccount } from './social-media.model';
import { SocialMediaPostingService } from './social-media-posting.service';
import { notificationService } from '../notification/notification.service';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
} from '../notification/notification.constant';
import { NotificationPriority } from '../notification/notification.interface';

export class SocialMediaScheduler {
  private static instance: SocialMediaScheduler;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SocialMediaScheduler {
    if (!SocialMediaScheduler.instance) {
      SocialMediaScheduler.instance = new SocialMediaScheduler();
    }
    return SocialMediaScheduler.instance;
  }

  initialize(): void {
    if (this.isInitialized) {
      console.log('Social Media Scheduler already initialized');
      return;
    }

    // Check for scheduled posts every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    });

    this.isInitialized = true;
    console.log('Social Media Scheduler initialized');
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Find posts that are scheduled to be published now (within the last 5 minutes)
      const scheduledPosts = await Post.find({
        status: 'scheduled',
        scheduled_date: {
          $gte: fiveMinutesAgo,
          $lte: now,
        },
        isDeleted: false,
      });

      console.log(`Found ${scheduledPosts.length} posts to process`);

      for (const post of scheduledPosts) {
        await this.processPost(post);
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processPost(post: any): Promise<void> {
    try {
      // Get user's connected social media accounts
      const connectedAccounts = await SocialMediaAccount.find({
        owner: post.user_id,
        isConnected: true,
        platform: {
          $in: post.platform
            ? [post.platform]
            : ['facebook', 'instagram', 'twitter', 'linkedin'],
        },
      });

      if (connectedAccounts.length === 0) {
        console.log(`No connected accounts found for user ${post.user_id}`);
        // Update post status to failed
        await Post.findByIdAndUpdate(post._id, {
          status: 'draft',
        });

        // Send notification to user
        await this.sendNotification(
          post.user_id,
          'Post Publishing Failed',
          'No connected social media accounts found. Please connect your accounts in settings.',
          NOTIFICATION_PRIORITY.HIGH
        );
        return;
      }

      const postResults = [];
      let successCount = 0;
      let failureCount = 0;

      // Post to each connected platform
      for (const account of connectedAccounts) {
        try {
          const postContent = {
            text: post.caption,
            imageUrl: post.image_url,
            videoUrl: post.video_url,
            hashtags: post.hashtags,
          };

          let result;
          switch (account.platform) {
            case 'facebook':
              result = await SocialMediaPostingService.postToFacebook(
                account,
                postContent
              );
              break;
            case 'instagram':
              result = await SocialMediaPostingService.postToInstagram(
                account,
                postContent
              );
              break;
            case 'twitter':
              result = await SocialMediaPostingService.postToTwitter(
                account,
                postContent
              );
              break;
            case 'linkedin':
              result = await SocialMediaPostingService.postToLinkedIn(
                account,
                postContent
              );
              break;
            default:
              result = { success: false, error: 'Unsupported platform' };
          }

          postResults.push({
            platform: account.platform,
            accountName: account.accountName,
            ...result,
          });

          if (result.success) {
            successCount++;
            console.log(
              `Successfully posted to ${account.platform} (${account.accountName})`
            );
          } else {
            failureCount++;
            console.error(
              `Failed to post to ${account.platform} (${account.accountName}):`,
              result.error
            );
          }
        } catch (error) {
          failureCount++;
          console.error(`Error posting to ${account.platform}:`, error);
          postResults.push({
            platform: account.platform,
            accountName: account.accountName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update post status based on results
      const newStatus = successCount > 0 ? 'published' : 'draft';
      await Post.findByIdAndUpdate(post._id, {
        status: newStatus,
        metadata: {
          ...post.metadata,
          socialMediaResults: postResults,
          publishedAt: successCount > 0 ? new Date() : undefined,
        },
      });

      // Send notification to user about posting results
      await this.sendPostingNotification(
        post.user_id,
        post,
        successCount,
        failureCount,
        postResults
      );
    } catch (error) {
      console.error(`Error processing post ${post._id}:`, error);

      // Update post status to failed
      await Post.findByIdAndUpdate(post._id, {
        status: 'draft',
        metadata: {
          ...post.metadata,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Send error notification
      await this.sendNotification(
        post.user_id,
        'Post Publishing Error',
        'An error occurred while publishing your scheduled post. Please try again.',
        NOTIFICATION_PRIORITY.HIGH
      );
    }
  }

  private async sendPostingNotification(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post: any,
    successCount: number,
    failureCount: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results: any[]
  ): Promise<void> {
    try {
      let title: string;
      let message: string;
      let priority: NotificationPriority = NOTIFICATION_PRIORITY.MEDIUM;

      if (successCount > 0 && failureCount === 0) {
        // All successful
        title = 'Post Published Successfully';
        message = `Your post "${post.caption?.substring(0, 50)}..." has been published to ${successCount} platform${successCount > 1 ? 's' : ''}.`;
        priority = NOTIFICATION_PRIORITY.LOW;
      } else if (successCount > 0 && failureCount > 0) {
        // Partial success
        title = 'Post Partially Published';
        message = `Your post was published to ${successCount} platform${successCount > 1 ? 's' : ''}, but failed on ${failureCount} platform${failureCount > 1 ? 's' : ''}. Check your account connections.`;
        priority = NOTIFICATION_PRIORITY.MEDIUM;
      } else {
        // All failed
        title = 'Post Publishing Failed';
        message = `Failed to publish your post to any connected platforms. Please check your account connections and try again.`;
        priority = NOTIFICATION_PRIORITY.HIGH;
      }

      await notificationService.createNotification({
        userId,
        type: NOTIFICATION_TYPES.POST_PUBLISHED,
        title,
        message,
        priority,
        data: {
          postId: post._id,
          results,
          successCount,
          failureCount,
        },
      });
    } catch (error) {
      console.error('Error sending posting notification:', error);
    }
  }

  private async sendNotification(
    userId: string,
    title: string,
    message: string,
    priority: string
  ): Promise<void> {
    try {
      await notificationService.createNotification({
        userId,
        type: NOTIFICATION_TYPES.POST_FAILED,
        title,
        message,
        priority: priority as NotificationPriority,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Manual method to process a specific post
  async processPostById(postId: string): Promise<void> {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.status !== 'scheduled') {
        throw new Error('Post is not scheduled');
      }

      await this.processPost(post);
    } catch (error) {
      console.error(`Error processing post ${postId}:`, error);
      throw error;
    }
  }

  // Method to get posting statistics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getPostingStats(userId?: string): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchCondition: any = {
        'metadata.socialMediaResults': { $exists: true },
        isDeleted: { $ne: true }, // Exclude deleted posts
      };

      if (userId) {
        matchCondition.user_id = userId;
      }

      const stats = await Post.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            successfulPosts: {
              $sum: {
                $cond: [{ $eq: ['$status', 'published'] }, 1, 0],
              },
            },
            failedPosts: {
              $sum: {
                $cond: [{ $ne: ['$status', 'published'] }, 1, 0],
              },
            },
          },
        },
      ]);

      return (
        stats[0] || {
          totalPosts: 0,
          successfulPosts: 0,
          failedPosts: 0,
        }
      );
    } catch (error) {
      console.error('Error getting posting stats:', error);
      return {
        totalPosts: 0,
        successfulPosts: 0,
        failedPosts: 0,
      };
    }
  }
}

// Export singleton instance
export const socialMediaScheduler = SocialMediaScheduler.getInstance();
