import { User } from '../auth/auth.model';
import { Post } from '../mongo-posts/mongo-posts.model';
import { Video } from '../video/video.model';
import { UserSettings } from '../settings/settings.model';
import { UserService } from '../user/user.service';

interface UserContextForAI {
  userId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
  timezone?: string;
  defaultPlatforms?: string[];
  recentCaptions?: string[];
  contentStyle?: string;
  userStats?: {
    totalPosts: number;
    totalVideos: number;
    accountAge: number;
  };
}

/**
 * Gather user context information for AI caption generation
 * @param userId The user ID to gather context for
 * @returns User context object for AI personalization
 */
const getUserContextForAI = async (userId: string): Promise<UserContextForAI> => {
  try {
    // Fetch user profile, settings, and stats in parallel
    const [user, userSettings, userStats] = await Promise.all([
      User.findById(userId).select('-password'),
      UserSettings.findOne({ userId }),
      UserService.getUserStats(userId),
    ]);

    if (!user) {
      return {};
    }

    // Get recent captions from user's posts and videos for style consistency
    const [recentPosts, recentVideos] = await Promise.all([
      Post.find({ 
        user_id: userId, 
        isDeleted: { $ne: true },
        caption: { $exists: true, $ne: '' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('caption'),
      Video.find({ 
        owner: userId, 
        isDeleted: { $ne: true },
        caption: { $exists: true, $ne: '' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('caption'),
    ]);

    // Extract captions for style analysis
    const recentCaptions: string[] = [];
    recentPosts.forEach(post => {
      if (post.caption && post.caption.trim()) {
        recentCaptions.push(post.caption.trim());
      }
    });
    recentVideos.forEach(video => {
      if (video.caption && video.caption.trim()) {
        recentCaptions.push(video.caption.trim());
      }
    });

    // Determine content style based on recent captions
    let contentStyle = 'engaging';
    if (recentCaptions.length > 0) {
      const combinedCaptions = recentCaptions.join(' ').toLowerCase();
      
      if (combinedCaptions.includes('professional') || combinedCaptions.includes('business')) {
        contentStyle = 'professional';
      } else if (combinedCaptions.includes('fun') || combinedCaptions.includes('exciting') || combinedCaptions.includes('amazing')) {
        contentStyle = 'enthusiastic';
      } else if (combinedCaptions.includes('tips') || combinedCaptions.includes('learn') || combinedCaptions.includes('how to')) {
        contentStyle = 'educational';
      } else if (combinedCaptions.includes('inspire') || combinedCaptions.includes('motivate') || combinedCaptions.includes('believe')) {
        contentStyle = 'inspirational';
      }
    }

    // Build user context object
    const userContext: UserContextForAI = {
      userId,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      language: userSettings?.preferences?.language || user.preferences?.language || 'en',
      timezone: userSettings?.preferences?.timezone || user.preferences?.timezone || 'UTC',
      defaultPlatforms: userSettings?.social?.defaultPlatforms || [],
      recentCaptions: recentCaptions.slice(0, 3), // Limit to 3 most recent
      contentStyle,
      userStats: {
        totalPosts: userStats.totalPosts,
        totalVideos: userStats.totalVideos,
        accountAge: userStats.accountAge,
      },
    };

    return userContext;
  } catch (error) {
    console.error('Error gathering user context for AI:', error);
    return {};
  }
};

/**
 * Analyze user's content patterns to suggest optimal posting times and content types
 * @param userId The user ID to analyze
 * @returns Content insights and recommendations
 */
const analyzeUserContentPatterns = async (userId: string) => {
  try {
    const [posts, videos] = await Promise.all([
      Post.find({ 
        user_id: userId, 
        isDeleted: { $ne: true },
        status: 'published'
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('createdAt hashtags platform'),
      Video.find({ 
        owner: userId, 
        isDeleted: { $ne: true },
        isScheduled: false // Only published videos
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('createdAt tags socialMediaPlatforms'),
    ]);

    // Analyze posting patterns
    const postingHours: { [hour: number]: number } = {};
    const platformUsage: { [platform: string]: number } = {};
    const hashtagFrequency: { [hashtag: string]: number } = {};

    [...posts, ...videos].forEach(content => {
      if (content.createdAt) {
        const hour = content.createdAt.getHours();
        postingHours[hour] = (postingHours[hour] || 0) + 1;
      }

      // Analyze platform usage
      if ('platform' in content && content.platform) {
        platformUsage[content.platform] = (platformUsage[content.platform] || 0) + 1;
      }
      if ('socialMediaPlatforms' in content && content.socialMediaPlatforms) {
        content.socialMediaPlatforms.forEach((platform: string) => {
          platformUsage[platform] = (platformUsage[platform] || 0) + 1;
        });
      }

      // Analyze hashtag usage
      if ('hashtags' in content && content.hashtags) {
        content.hashtags.forEach((hashtag: string) => {
          const cleanHashtag = hashtag.toLowerCase().replace('#', '');
          hashtagFrequency[cleanHashtag] = (hashtagFrequency[cleanHashtag] || 0) + 1;
        });
      }
      if ('tags' in content && content.tags) {
        content.tags.forEach((tag: string) => {
          const cleanTag = tag.toLowerCase().replace('#', '');
          hashtagFrequency[cleanTag] = (hashtagFrequency[cleanTag] || 0) + 1;
        });
      }
    });

    // Find optimal posting hours (top 3)
    const optimalHours = Object.entries(postingHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Find most used platforms
    const topPlatforms = Object.entries(platformUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([platform]) => platform);

    // Find most used hashtags
    const topHashtags = Object.entries(hashtagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag]) => `#${hashtag}`);

    return {
      optimalPostingHours: optimalHours,
      preferredPlatforms: topPlatforms,
      frequentHashtags: topHashtags,
      totalContent: posts.length + videos.length,
      contentTypeRatio: {
        posts: posts.length,
        videos: videos.length,
      },
    };
  } catch (error) {
    console.error('Error analyzing user content patterns:', error);
    return null;
  }
};

export const AIContextService = {
  getUserContextForAI,
  analyzeUserContentPatterns,
};