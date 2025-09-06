import fs from 'fs';
import { MongoError } from 'mongodb';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { IImage } from './image.interface';
import { Image } from './image.model';

// Multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

const saveImage = async (file: MulterFile, userId: string): Promise<IImage> => {
  try {
    // Generate a truly unique filename using UUID
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${ext}`;

    // Update the file path with the new unique filename
    const oldPath = file.path;
    const newPath = path.join(path.dirname(oldPath), uniqueFilename);

    // Rename the file to use the unique filename
    fs.renameSync(oldPath, newPath);

    // Update file object
    file.filename = uniqueFilename;
    file.path = newPath;

    // Get image dimensions using sharp
    const metadata = await sharp(newPath).metadata();

    // Create image record
    const imageData: Partial<IImage> = {
      filename: uniqueFilename,
      original_filename: file.originalname,
      file_path: path
        .join('uploads', 'images', uniqueFilename)
        .replace(/\\/g, '/'),
      file_size: file.size,
      mime_type: file.mimetype,
      width: metadata.width || 0,
      height: metadata.height || 0,
      is_used: false,
      uploaded_at: new Date(),
      user_id: userId,
    };

    // Save to database
    const image = await Image.create(imageData);
    return image;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error saving image: ${error.message}`);
    }
    throw new Error('Error saving image: Unknown error');

    // Handle duplicate key error (though this should be very rare with UUID)
    // Check if error is a MongoDB duplicate key error
    const mongoError = error as MongoError;
    if (mongoError.code === 11000) {
      // Handle duplicate key error by generating a new unique filename

      // Generate an even more unique filename with timestamp + UUID
      const ext = path.extname(file.originalname);
      const timestampFilename = `${Date.now()}-${uuidv4()}${ext}`;

      // Update paths
      const newPath = path.join(
        process.cwd(),
        'uploads',
        'images',
        timestampFilename
      );
      fs.renameSync(file.path, newPath);

      file.filename = timestampFilename;

      // Retry with new filename
      const metadata = await sharp(newPath).metadata();

      const imageData: Partial<IImage> = {
        filename: timestampFilename,
        original_filename: file.originalname,
        file_path: path
          .join('uploads', 'images', timestampFilename)
          .replace(/\\/g, '/'),
        file_size: file.size,
        mime_type: file.mimetype,
        width: metadata.width || 0,
        height: metadata.height || 0,
        is_used: false,
        uploaded_at: new Date(),
        user_id: userId,
      };

      const image = await Image.create(imageData);
      return image;
    }

    throw error;
  }
};

const getAllImages = async (userId: string): Promise<IImage[]> => {
  try {
    const images = await Image.find({ user_id: userId }).sort({
      uploaded_at: -1,
    });
    return images;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error getting all images: ${error.message}`);
    }
    throw new Error('Error getting all images: Unknown error');
  }
};

const getImageById = async (id: string): Promise<IImage | null> => {
  try {
    const image = await Image.findById(id);
    return image;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error getting image by ID: ${error.message}`);
    }
    throw new Error('Error getting image by ID: Unknown error');
  }
};

const updateImage = async (
  id: string,
  updateData: Partial<IImage>
): Promise<IImage | null> => {
  try {
    const image = await Image.findByIdAndUpdate(id, updateData, { new: true });
    return image;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error updating image: ${error.message}`);
    }
    throw new Error('Error updating image: Unknown error');
  }
};

const deleteImage = async (id: string): Promise<IImage | null> => {
  try {
    const image = await Image.findByIdAndDelete(id);

    // Delete file from disk if image record exists
    if (image) {
      const filePath = path.join(process.cwd(), image.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return image;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error deleting image: ${error.message}`);
    }
    throw new Error('Error deleting image: Unknown error');
  }
};

export const ImageService = {
  saveImage,
  getAllImages,
  getImageById,
  updateImage,
  deleteImage,
};
