import axios from 'axios';
import { ISocialMediaAccount } from './social-media.interface';

export interface PostContent {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
}

export interface ScheduledPost {
  id: string;
  content: PostContent;
  platforms: string[];
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed';
  userId: string;
}

export class SocialMediaPostingService {
  /**
   * Post content to Facebook
   */
  static async postToFacebook(
    account: ISocialMediaAccount,
    content: PostContent
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const { accessToken, accountId } = account;
      
      // Prepare post data
      const postData: Record<string, unknown> = {
        message: content.text || '',
        access_token: accessToken,
      };

      // Add media if provided
      if (content.imageUrl) {
        postData.url = content.imageUrl;
      }
      if (content.link) {
        postData.link = content.link;
      }

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${accountId}/feed`,
        postData
      );

      return {
        success: true,
        postId: response.data.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Facebook posting failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Post content to Instagram
   */
  static async postToInstagram(
    account: ISocialMediaAccount,
    content: PostContent
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const { accessToken, accountId } = account;

      if (!content.imageUrl && !content.videoUrl) {
        return {
          success: false,
          error: 'Instagram requires an image or video',
        };
      }

      // Step 1: Create media container
      const mediaData: Record<string, unknown> = {
        image_url: content.imageUrl || content.videoUrl,
        caption: content.text || '',
        access_token: accessToken,
      };

      if (content.videoUrl) {
        mediaData.media_type = 'VIDEO';
      }

      const containerResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${accountId}/media`,
        mediaData
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Instagram posting failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Post content to Twitter
   */
  static async postToTwitter(
    account: ISocialMediaAccount,
    content: PostContent
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const { accessToken } = account;

      if (!content.text) {
        return {
          success: false,
          error: 'Twitter requires text content',
        };
      }

      const tweetData: Record<string, unknown> = {
        text: content.text,
      };

      // Add media if provided (requires media upload first)
      if (content.imageUrl) {
        // Note: In a real implementation, you'd need to upload the media first
        // and get a media_id, then attach it to the tweet
        tweetData.media = {
          media_ids: [], // This would contain uploaded media IDs
        };
      }

      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        tweetData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        postId: response.data.data.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Twitter posting failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Post content to LinkedIn
   */
  static async postToLinkedIn(
    account: ISocialMediaAccount,
    content: PostContent
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const { accessToken, accountId } = account;

      const postData = {
        author: `urn:li:person:${accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text || '',
            },
            shareMediaCategory: content.imageUrl || content.link ? 'ARTICLE' : 'NONE',
            ...(content.link && {
              media: [
                {
                  status: 'READY',
                  description: {
                    text: content.text || '',
                  },
                  originalUrl: content.link,
                },
              ],
            }),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return {
        success: true,
        postId: response.data.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `LinkedIn posting failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Post content to multiple platforms
   */
  static async postToMultiplePlatforms(
    accounts: ISocialMediaAccount[],
    content: PostContent
  ): Promise<{
    results: Array<{
      platform: string;
      success: boolean;
      postId?: string;
      error?: string;
    }>;
  }> {
    const results = [];

    for (const account of accounts) {
      let result;
      
      switch (account.platform.toLowerCase()) {
        case 'facebook':
          result = await this.postToFacebook(account, content);
          break;
        case 'instagram':
          result = await this.postToInstagram(account, content);
          break;
        case 'twitter':
          result = await this.postToTwitter(account, content);
          break;
        case 'linkedin':
          result = await this.postToLinkedIn(account, content);
          break;
        default:
          result = {
            success: false,
            error: `Unsupported platform: ${account.platform}`,
          };
      }

      results.push({
        platform: account.platform,
        ...result,
      });
    }

    return { results };
  }

  /**
   * Schedule a post for later
   */
  static async schedulePost(
    _userId: string,
    _content: PostContent,
    _platforms: string[],
    _scheduledTime: Date
  ): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
    try {
      // In a real implementation, you would:
      // 1. Save the scheduled post to database
      // 2. Set up a job queue (like Bull or Agenda) to process it at the scheduled time
      // 3. Return the schedule ID
      
      // For now, we'll just return a mock response
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        scheduleId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Scheduling failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get posting analytics for an account
   */
  static async getPostingAnalytics(
    account: ISocialMediaAccount,
    postId: string
  ): Promise<{
    success: boolean;
    analytics?: {
      likes: number;
      shares: number;
      comments: number;
      reach: number;
    };
    error?: string;
  }> {
    try {
      const { accessToken, platform } = account;

      switch (platform.toLowerCase()) {
        case 'facebook':
          await axios.get(
            `https://graph.facebook.com/v18.0/${postId}/insights`,
            {
              params: {
                metric: 'post_impressions,post_engaged_users',
                access_token: accessToken,
              },
            }
          );
          break;
        case 'instagram':
          await axios.get(
            `https://graph.facebook.com/v18.0/${postId}/insights`,
            {
              params: {
                metric: 'impressions,reach,likes,comments,shares',
                access_token: accessToken,
              },
            }
          );
          break;
        default:
          return {
            success: false,
            error: `Analytics not supported for ${platform}`,
          };
      }

      // Parse analytics data (simplified)
      const analytics = {
        likes: 0,
        shares: 0,
        comments: 0,
        reach: 0,
      };

      return {
        success: true,
        analytics,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Analytics fetch failed: ${errorMessage}`,
      };
    }
  }
}