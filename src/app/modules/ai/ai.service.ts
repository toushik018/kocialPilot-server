import fs from 'fs/promises';
import { OpenAI } from 'openai';
import config from '../../config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate a caption for an image
 * @param imagePath Path to the image file or Cloudinary URL
 * @returns Generated caption and hashtags
 */
const generateImageCaption = async (imagePath: string) => {
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
        // Default to jpeg for others
      }
    } else {
      // Local file path
      const imageBuffer = await fs.readFile(imagePath);
      base64Image = imageBuffer.toString('base64');
      // Keep default mimeType = 'image/jpeg'
    }

    // Call OpenAI API to generate caption
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You are a social media content expert. Generate a compelling, engaging caption for the uploaded image. The caption should be attention-grabbing, relevant to the image content, and optimized for social media engagement. Also generate 3-5 relevant hashtags that would help increase the post's reach.",
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a compelling social media caption for this image along with 3-5 relevant hashtags.',
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
    const parts = generatedText.split(/\n\n|\n/);
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
      caption = parts[0] || generatedText;
      // If no hashtags found, generate some based on the caption
      const hashtagResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Generate 3-5 relevant hashtags for the following social media caption. Return only the hashtags, separated by spaces.',
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
    console.error('Error generating caption:', error);
    throw new Error('Failed to generate caption');
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
 * @returns Generated caption and hashtags
 */
const generateVideoCaption = async (
  videoPath: string,
  videoMetadata?: {
    duration?: number;
    filename?: string;
    description?: string;
    thumbnailPath?: string;
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

        // Use OpenAI Vision API to analyze the thumbnail
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a social media content expert. Analyze this video thumbnail and generate a compelling, engaging caption for the video. The caption should be attention-grabbing, relevant to what you see in the image, and optimized for social media engagement. Also generate 3-5 relevant hashtags based on the visual content.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Generate a compelling social media caption for this video thumbnail. ${videoMetadata.description ? `Additional context: ${videoMetadata.description}` : ''} ${videoMetadata.duration ? `Video duration: ${Math.round(videoMetadata.duration)} seconds.` : ''} Include 3-5 relevant hashtags.`,
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

    let prompt = `Generate a compelling, engaging social media caption for a video file named "${filename}".`;

    if (duration) {
      prompt += ` The video is ${Math.round(duration)} seconds long.`;
    }

    if (description) {
      prompt += ` Additional context: ${description}.`;
    }

    prompt += ` Create an engaging caption that would work well for social media. Focus on creating excitement and encouraging engagement. Also generate 3-5 relevant hashtags. Format the response with the caption first, followed by hashtags.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a social media content expert. Generate compelling, engaging captions for video content. The caption should be attention-grabbing, create curiosity, and be optimized for social media engagement. Always include 3-5 relevant hashtags.',
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
