import fs from 'fs/promises';
import { OpenAI } from 'openai';
import config from '../../config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Cache for user contexts to reduce API calls
interface UserContext {
  userId: string;
  name: string;
  contentStyle: string;
  defaultPlatforms: string[];
}

const userContextCache = new Map<string, { context: UserContext; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a caption for an image
 * @param imagePath Path to the image file or Cloudinary URL
 * @param userId User ID for personalized captions
 * @returns Generated caption and hashtags
 */
const generateImageCaption = async (
  imagePath: string,
  userId: string
): Promise<{ caption: string; hashtags: string[] }> => {
  try {
    // Get cached user context or fetch new one
    let userContext = null;
    const now = Date.now();
    const cached = userContextCache.get(userId);
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      userContext = cached.context;
    } else {
      // In a real implementation, this would fetch from AIContextService
      // For now, we'll use a simple context structure
      userContext = {
        userId,
        name: 'User',
        contentStyle: 'engaging',
        defaultPlatforms: ['instagram', 'twitter']
      };
      userContextCache.set(userId, { context: userContext, timestamp: now });
    }

    // Determine if it's a Cloudinary URL or local path
     const isCloudinaryUrl = imagePath.includes('cloudinary.com');
     const imageUrl = isCloudinaryUrl ? imagePath : `http://localhost:8000${imagePath}`;

    // Use faster GPT-4o-mini for better performance
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate an engaging social media caption for this image. User context: ${JSON.stringify(userContext)}. 
              
              Provide JSON response:
              {
                "caption": "compelling 2-3 sentence caption",
                "hashtags": ["5-8 relevant hashtags"]
              }`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low' // Use low detail for faster processing
              },
            },
          ],
        },
      ],
      max_tokens: 200, // Reduced tokens for faster response
      temperature: 0.7, // Slightly more deterministic
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response with fallback
    try {
      const result = JSON.parse(content);
      return {
        caption: result.caption || 'Generated caption',
        hashtags: result.hashtags || [],
      };
    } catch {
       // Fallback if JSON parsing fails
       return {
         caption: content.substring(0, 200),
         hashtags: ['#socialmedia', '#content'],
       };
     }
  } catch (error) {
    console.error('Error generating image caption:', error);
    throw new Error(`Caption generation failed: ${error}`);
  }
};

/**
 * Generate alt text for an image
 * @param imagePath Path to the image file or Cloudinary URL
 * @returns Generated alt text
 */
const generateAltText = async (imagePath: string) => {
  try {
    let base64Image: string;
    let mimeType = 'image/jpeg';

    if (imagePath.startsWith('http')) {
      // Cloudinary or external URL - fetch the image
      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image from URL: ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Image = buffer.toString('base64');

      // Try to determine mime type from response headers or URL
      const contentType = response.headers.get('content-type');
      if (contentType) {
        mimeType = contentType;
      } else {
        // Fallback: guess from URL extension
        const urlLower = imagePath.toLowerCase();
        if (urlLower.includes('.png')) mimeType = 'image/png';
        else if (urlLower.includes('.webp')) mimeType = 'image/webp';
        else if (urlLower.includes('.gif')) mimeType = 'image/gif';
      }
    } else {
      // Local file path
      const imageBuffer = await fs.readFile(imagePath);
      base64Image = imageBuffer.toString('base64');
    }

    // Call OpenAI API to generate alt text
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an accessibility expert. Generate a concise, descriptive alt text for the uploaded image. The alt text should accurately describe the image content for users who cannot see the image. Keep it under 125 characters.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a concise alt text for this image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating alt text:', error);
    // Don't throw an error that would break the entire process, just return empty string
    return '';
  }
};

/**
 * Generate a caption for a video
 * @param videoPath Path to the video file or Cloudinary URL
 * @param videoMetadata Optional metadata about the video (duration, size, etc.)
 * @param userContext Optional user context for personalization
 * @returns Generated caption and hashtags
 */
const generateVideoCaption = async (
  videoPath: string,
  videoMetadata?: {
    duration?: number;
    filename?: string;
    description?: string;
    thumbnailPath?: string;
  },
  userContext?: {
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
) => {
  try {
    // If thumbnail is available, use it for visual analysis
    if (videoMetadata?.thumbnailPath) {
      try {
        let base64Image: string;
        let mimeType = 'image/jpeg';

        if (videoMetadata.thumbnailPath.startsWith('http')) {
          // Cloudinary or external URL - fetch the image
          const response = await fetch(videoMetadata.thumbnailPath);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch thumbnail from URL: ${response.statusText}`
            );
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Image = buffer.toString('base64');

          const contentType = response.headers.get('content-type');
          if (contentType) {
            mimeType = contentType;
          }
        } else {
          // Local file path - construct full path
          const fullThumbnailPath = videoMetadata.thumbnailPath.startsWith(
            '/uploads'
          )
            ? `${process.cwd()}${videoMetadata.thumbnailPath}`
            : videoMetadata.thumbnailPath;

          const imageBuffer = await fs.readFile(fullThumbnailPath);
          base64Image = imageBuffer.toString('base64');
        }

        // Build personalized system prompt based on user context
        let systemPrompt = 'You are a social media content expert. Analyze this video thumbnail and generate a compelling, engaging caption for the video. The caption should be attention-grabbing, relevant to what you see in the image, and optimized for social media engagement. Also generate 3-5 relevant hashtags based on the visual content.';
        
        if (userContext) {
          if (userContext.name || userContext.firstName) {
            const userName = userContext.name || userContext.firstName;
            systemPrompt += ` The content creator is ${userName}.`;
          }
          
          if (userContext.defaultPlatforms && userContext.defaultPlatforms.length > 0) {
            systemPrompt += ` This content will primarily be shared on ${userContext.defaultPlatforms.join(', ')}.`;
          }
          
          if (userContext.contentStyle) {
            systemPrompt += ` The user prefers a ${userContext.contentStyle} style of content.`;
          }
          
          if (userContext.userStats) {
            if (userContext.userStats.accountAge < 30) {
              systemPrompt += ' This is from a newer content creator, so make the caption approachable and engaging for building an audience.';
            } else if (userContext.userStats.totalVideos > 50) {
              systemPrompt += ' This is from an experienced content creator with a substantial video library.';
            }
          }
          
          if (userContext.recentCaptions && userContext.recentCaptions.length > 0) {
            systemPrompt += ` For consistency with their content style, here are some recent captions they've used: ${userContext.recentCaptions.slice(0, 3).join('; ')}.`;
          }
        }

        // Build user prompt with context
        let userPrompt = `Generate a compelling social media caption for this video thumbnail. ${videoMetadata.description ? `Additional context: ${videoMetadata.description}` : ''} ${videoMetadata.duration ? `Video duration: ${Math.round(videoMetadata.duration)} seconds.` : ''}`;
        
        if (userContext?.language && userContext.language !== 'en') {
          userPrompt += ` Generate the caption in ${userContext.language} language.`;
        }
        
        userPrompt += ' Include 3-5 relevant hashtags.';

        // Use OpenAI Vision API to analyze the thumbnail
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        });

        // Extract caption and hashtags from response
        const generatedText = response.choices[0]?.message?.content || '';

        // Split the response into caption and hashtags
        let caption = '';
        let hashtags: string[] = [];

        // Extract hashtags (words starting with #)
        const hashtagRegex = /#[\w\d]+/g;
        const matches = generatedText.match(hashtagRegex);

        if (matches && matches.length > 0) {
          hashtags = matches;
          // Remove hashtags from the caption
          caption = generatedText.replace(hashtagRegex, '').trim();
        } else {
          caption = generatedText.trim();
          // If no hashtags found, generate some based on the caption
          const hashtagResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content:
                  'Generate 3-5 relevant hashtags for the following video caption. Return only the hashtags, separated by spaces.',
              },
              {
                role: 'user',
                content: caption,
              },
            ],
            max_tokens: 50,
          });

          const generatedHashtags =
            hashtagResponse.choices[0]?.message?.content || '';
          hashtags = generatedHashtags.match(hashtagRegex) || [];
        }

        return {
          caption: caption.trim(),
          hashtags: hashtags,
        };
      } catch (thumbnailError) {
        console.warn(
          'Failed to analyze thumbnail, falling back to text-based generation:',
          thumbnailError
        );
        // Fall through to text-based generation
      }
    }

    // Fallback: text-based analysis when thumbnail is not available or fails
    const filename =
      videoMetadata?.filename || videoPath.split('/').pop() || 'video';
    const duration = videoMetadata?.duration;
    const description = videoMetadata?.description;

    // Build personalized system prompt for fallback
    let fallbackSystemPrompt = 'You are a social media content expert. Generate compelling, engaging captions for video content. The caption should be attention-grabbing, create curiosity, and be optimized for social media engagement. Always include 3-5 relevant hashtags.';
    
    if (userContext) {
      if (userContext.name || userContext.firstName) {
        const userName = userContext.name || userContext.firstName;
        fallbackSystemPrompt += ` The content creator is ${userName}.`;
      }
      
      if (userContext.defaultPlatforms && userContext.defaultPlatforms.length > 0) {
        fallbackSystemPrompt += ` This content will primarily be shared on ${userContext.defaultPlatforms.join(', ')}.`;
      }
      
      if (userContext.contentStyle) {
        fallbackSystemPrompt += ` The user prefers a ${userContext.contentStyle} style of content.`;
      }
      
      if (userContext.userStats) {
        if (userContext.userStats.accountAge < 30) {
          fallbackSystemPrompt += ' This is from a newer content creator, so make the caption approachable and engaging for building an audience.';
        } else if (userContext.userStats.totalVideos > 50) {
          fallbackSystemPrompt += ' This is from an experienced content creator with a substantial video library.';
        }
      }
      
      if (userContext.recentCaptions && userContext.recentCaptions.length > 0) {
        fallbackSystemPrompt += ` For consistency with their content style, here are some recent captions they've used: ${userContext.recentCaptions.slice(0, 3).join('; ')}.`;
      }
    }

    let prompt = `Generate a compelling, engaging social media caption for a video file named "${filename}".`;

    if (duration) {
      prompt += ` The video is ${Math.round(duration)} seconds long.`;
    }

    if (description) {
      prompt += ` Additional context: ${description}.`;
    }

    if (userContext?.language && userContext.language !== 'en') {
      prompt += ` Generate the caption in ${userContext.language} language.`;
    }

    prompt += ` Create an engaging caption that would work well for social media. Focus on creating excitement and encouraging engagement. Also generate 3-5 relevant hashtags. Format the response with the caption first, followed by hashtags.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: fallbackSystemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
    });

    // Extract caption and hashtags from response
    const generatedText = response.choices[0]?.message?.content || '';

    let caption = '';
    let hashtags: string[] = [];

    // Extract hashtags (words starting with #)
    const hashtagRegex = /#[\w\d]+/g;
    const matches = generatedText.match(hashtagRegex);

    if (matches && matches.length > 0) {
      hashtags = matches;
      // Remove hashtags from the caption
      caption = generatedText.replace(hashtagRegex, '').trim();
    } else {
      caption = generatedText.trim();
      // If no hashtags found, generate some based on the caption
      const hashtagResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Generate 3-5 relevant hashtags for the following video caption. Return only the hashtags, separated by spaces.',
          },
          {
            role: 'user',
            content: caption,
          },
        ],
        max_tokens: 50,
      });

      const generatedHashtags =
        hashtagResponse.choices[0]?.message?.content || '';
      hashtags = generatedHashtags.match(hashtagRegex) || [];
    }

    return {
      caption: caption.trim(),
      hashtags: hashtags,
    };
  } catch (error) {
    console.error('Error generating video caption:', error);
    throw new Error('Failed to generate video caption');
  }
};

export const AIService = {
  generateImageCaption,
  generateAltText,
  generateVideoCaption,
};
