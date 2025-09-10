import { Response } from 'express';
import httpStatus from 'http-status';
import path from 'path';
import { catchAsync } from '../../utils/catchAsync';
import { CustomRequest } from '../../interface/types';
import { ImageService } from '../image/image.service';
import { MongoPostService } from '../mongo-posts/mongo-posts.service';
import { AIService } from './ai.service';

interface CaptionResult {
  caption: string;
  hashtags: string[];
}

const uploadImageWithCaption = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const file = req.file;
    const userId = req.user?.userId;
    const userEmail = req.user?.email || '';
    const username = req.user?.username || userEmail.split('@')[0];
    const { style = 'engaging', platform = 'instagram' } = req.body;

    if (!file) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    if (!userId) {
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    try {
      // Step 1: Save image to database and get image info
      const savedImage = await ImageService.saveImage(file, userId);

      // Step 2: Generate caption and alt text using AI
      // Use the file_path directly (it will be either local path or Cloudinary URL)
      const imagePath = savedImage.file_path.startsWith('http')
        ? savedImage.file_path
        : path.join(process.cwd(), savedImage.file_path);

      let captionResult: CaptionResult = { caption: '', hashtags: [] };
      let altText = '';

      try {
        // Generate caption and hashtags with userId
        captionResult = await AIService.generateImageCaption(imagePath, userId);

        // Generate alt text
        altText = await AIService.generateAltText(imagePath);
      } catch (captionError) {
        // Continue with empty caption if AI fails
        throw new Error(`Error generating AI content: ${captionError}`);
      }

      // Step 3: Create post in posts collection with all the data
      const imageUrl = savedImage.file_path.startsWith('http')
        ? savedImage.file_path
        : `/${savedImage.file_path}`;

      console.log('🖼️ Image URL being used:', imageUrl);

      await MongoPostService.createPostWithGeneratedContent(
        {
          file_path: savedImage.file_path,
          image_url: imageUrl,
        },
        {
          caption: captionResult.caption,
          hashtags: captionResult.hashtags,
          alt_text: altText,
        },
        userId,
        userEmail,
        username
      );

      // Step 4: Mark image as used
      await ImageService.updateImage(savedImage._id!.toString(), {
        is_used: true,
      });

      // Transform the response to match frontend expectations
      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Image uploaded and post scheduled successfully',
        image: {
          id: savedImage._id
            ? parseInt(savedImage._id.toString().slice(-8), 16)
            : 0, // Generate a numeric ID from ObjectId
          filename: savedImage.filename,
          original_filename: savedImage.original_filename,
          file_path: savedImage.file_path, // Keep the full Cloudinary URL
          image_url: imageUrl, // Add explicit image_url field
          file_size: savedImage.file_size,
          mime_type: savedImage.mime_type,
          width: savedImage.width,
          height: savedImage.height,
          created_at: savedImage.uploaded_at
            ? new Date(savedImage.uploaded_at).toISOString()
            : new Date().toISOString(),
        },
        caption: {
          text: captionResult.caption,
          style: style,
          platform: platform,
          character_count: captionResult.caption.length,
          hashtag_count: captionResult.hashtags.length,
          hashtags: captionResult.hashtags,
        },
        post_created: true, // Flag to indicate post was already created
      });
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('Invalid ID')) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid image ID or file',
          error: error.message,
        });
        return;
      }

      // Handle MongoDB duplicate key errors
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'Image with this filename already exists',
          error: 'Duplicate filename',
        });
        return;
      }

      // Handle general errors
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to process image upload',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
);

export const AIController = {
  uploadImageWithCaption,
};
