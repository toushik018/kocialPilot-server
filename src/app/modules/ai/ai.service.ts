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
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
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
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
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

export const AIService = {
  generateImageCaption,
  generateAltText,
};
