import cron from 'node-cron';
import { Notification } from './notification.model';
import { notificationService } from './notification.service';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './notification.constant';
import { NotificationPriority } from './notification.interface';

// Import models dynamically to avoid circular dependencies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Post: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let User: any;

const initializeModels = async () => {
  if (!Post) {
    const mongoPostModule = await import('../mongo-posts/mongo-posts.model');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Post = (mongoPostModule as any).Post || mongoPostModule;
  }
  if (!User) {
    const userModule = await import('../auth/auth.model');
    User = userModule.User;
  }
};

class NotificationScheduler {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    await initializeModels();
    this.setupCronJobs();
    this.isInitialized = true;
    console.log('Notification scheduler initialized');
  }

  private setupCronJobs() {
    // Check for scheduled posts every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkScheduledPosts();
    });

    // Check for session expiry every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.checkSessionExpiry();
    });

    // Clean up expired notifications daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredNotifications();
    });

    console.log('Notification cron jobs scheduled');
  }

  private async checkScheduledPosts() {
    try {
      const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

      // Find posts scheduled to be published in the next 30 minutes
      const upcomingPosts = await Post.find({
        scheduledDate: {
          $gte: now,
          $lte: in30Minutes,
        },
        status: 'scheduled',
      }).populate('user_id', 'name email');

      for (const post of upcomingPosts) {
        // Check if notification already exists for this post
        const existingNotification = await Notification.findOne({
          userId: post.user_id._id,
          type: NOTIFICATION_TYPES.POST_SCHEDULED,
          'data.postId': post._id.toString(),
          status: 'unread',
        });

        if (!existingNotification) {
          await notificationService.createNotification({
            userId: post.user_id._id.toString(),
            type: NOTIFICATION_TYPES.POST_SCHEDULED,
            title: 'Post Publishing Soon',
            message: `Your post "${post.content?.substring(0, 50)}..." is scheduled to be published in ${Math.ceil((new Date(post.scheduledDate).getTime() - now.getTime()) / (1000 * 60))} minutes.`,
            priority: NOTIFICATION_PRIORITY.MEDIUM,
            data: {
              postId: post._id.toString(),
              scheduledDate: post.scheduledDate,
              platform: post.platform,
            },
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Expire in 24 hours
          });
        }
      }

      // Find posts scheduled to be published in the next hour (for high priority)
      const soonPosts = await Post.find({
        scheduledDate: {
          $gte: now,
          $lte: in1Hour,
        },
        status: 'scheduled',
      }).populate('user_id', 'name email');

      for (const post of soonPosts) {
        const timeUntilPost = Math.ceil((new Date(post.scheduledDate).getTime() - now.getTime()) / (1000 * 60));
        
        // Create high priority notification for posts within 10 minutes
        if (timeUntilPost <= 10) {
          const existingHighPriorityNotification = await Notification.findOne({
            userId: post.user_id._id,
            type: NOTIFICATION_TYPES.POST_SCHEDULED,
            'data.postId': post._id.toString(),
            priority: NOTIFICATION_PRIORITY.HIGH,
            status: 'unread',
          });

          if (!existingHighPriorityNotification) {
            await notificationService.createNotification({
              userId: post.user_id._id.toString(),
              type: NOTIFICATION_TYPES.POST_SCHEDULED,
              title: 'Post Publishing Imminent!',
              message: `Your post is about to be published in ${timeUntilPost} minutes. Make sure everything is ready!`,
              priority: NOTIFICATION_PRIORITY.HIGH,
              data: {
                postId: post._id.toString(),
                scheduledDate: post.scheduledDate,
                platform: post.platform,
                urgent: true,
              },
              expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Expire in 2 hours
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking scheduled posts:', error);
    }
  }

  private async checkSessionExpiry() {
    try {
      const now = new Date();

      // Find users whose sessions will expire soon
      // This would depend on your session management implementation
      // For now, we'll create a general session expiry reminder
      
      const activeUsers = await User.find({
        lastLoginAt: {
          $gte: new Date(now.getTime() - 4 * 60 * 60 * 1000), // Active in last 4 hours
        },
      });

      for (const user of activeUsers) {
        // Calculate approximate session expiry (assuming 4-hour sessions)
        const sessionExpiry = new Date(user.lastLoginAt.getTime() + 4 * 60 * 60 * 1000);
        const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
        const minutesUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60));

        // Notify if session expires in 30 minutes
        if (minutesUntilExpiry <= 30 && minutesUntilExpiry > 0) {
          const existingNotification = await Notification.findOne({
            userId: user._id,
            type: NOTIFICATION_TYPES.SESSION_EXPIRING,
            createdAt: {
              $gte: new Date(now.getTime() - 60 * 60 * 1000), // Created in last hour
            },
            status: 'unread',
          });

          if (!existingNotification) {
            await notificationService.createNotification({
              userId: user._id.toString(),
              type: NOTIFICATION_TYPES.SESSION_EXPIRING,
              title: 'Session Expiring Soon',
              message: `Your session will expire in ${minutesUntilExpiry} minutes. Please save your work and refresh to continue.`,
              priority: NOTIFICATION_PRIORITY.MEDIUM,
              data: {
                expiryTime: sessionExpiry.toISOString(),
                minutesRemaining: minutesUntilExpiry,
              },
              expiresAt: new Date(sessionExpiry.getTime() + 60 * 60 * 1000), // Expire 1 hour after session expiry
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking session expiry:', error);
    }
  }

  private async cleanupExpiredNotifications() {
    try {
      const now = new Date();
      
      // Delete notifications that have expired
      const result = await Notification.deleteMany({
        expiresAt: { $lt: now },
      });

      console.log(`Cleaned up ${result.deletedCount} expired notifications`);

      // Also clean up old read notifications (older than 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oldReadResult = await Notification.deleteMany({
        status: 'read',
        readAt: { $lt: thirtyDaysAgo },
      });

      console.log(`Cleaned up ${oldReadResult.deletedCount} old read notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  // Manual methods for creating specific notifications
  async createPostScheduledNotification(postId: string, userId: string, scheduledDate: Date) {
    try {
      const post = await Post.findById(postId);
      if (!post) return;

      const now = new Date();
      const timeUntilPost = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60));

      await notificationService.createNotification({
        userId,
        type: NOTIFICATION_TYPES.POST_SCHEDULED,
        title: 'Post Scheduled Successfully',
        message: `Your post has been scheduled and will be published in ${timeUntilPost} minutes.`,
        priority: NOTIFICATION_PRIORITY.LOW,
        data: {
          postId,
          scheduledDate: scheduledDate.toISOString(),
          platform: post.platform,
        },
        expiresAt: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      console.error('Error creating post scheduled notification:', error);
    }
  }

  async createSystemNotification(userId: string, title: string, message: string, priority: NotificationPriority = NOTIFICATION_PRIORITY.MEDIUM) {
    try {
      await notificationService.createNotification({
        userId,
        type: NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
        title,
        message,
        priority,
        data: {
          source: 'system',
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire in 7 days
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createUserActivityNotification(userId: string, activityType: string, details: Record<string, any>) {
    try {
      let title = 'Account Activity';
      let message = 'There was activity on your account.';
      let priority: NotificationPriority = NOTIFICATION_PRIORITY.LOW;

      switch (activityType) {
        case 'login_from_new_device':
          title = 'New Device Login';
          message = `Your account was accessed from a new device: ${details.device || 'Unknown device'}.`;
          priority = NOTIFICATION_PRIORITY.MEDIUM;
          break;
        case 'password_changed':
          title = 'Password Changed';
          message = 'Your account password has been successfully changed.';
          priority = NOTIFICATION_PRIORITY.HIGH;
          break;
        case 'profile_updated':
          title = 'Profile Updated';
          message = 'Your profile information has been updated.';
          priority = NOTIFICATION_PRIORITY.LOW;
          break;
      }

      await notificationService.createNotification({
        userId,
        type: NOTIFICATION_TYPES.ACCOUNT_CONNECTED,
        title,
        message,
        priority,
        data: {
          activityType,
          details,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expire in 30 days
      });
    } catch (error) {
      console.error('Error creating user activity notification:', error);
    }
  }
}

export const notificationScheduler = new NotificationScheduler();