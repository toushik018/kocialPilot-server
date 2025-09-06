import { Schema, model } from 'mongoose';
import { IImage, ImageModel } from './image.interface';

const ImageSchema = new Schema<IImage>(
  {
    filename: {
      type: String,
      required: true,
      unique: true, // Ensure filename is unique
    },
    original_filename: {
      type: String,
      required: true,
    },
    file_path: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
    user_id: {
      type: String,
      required: true,
      index: true, // Add index for user_id queries
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
    },
  }
);

// Add indexes (only add them here, not in the field definitions)
ImageSchema.index({ user_id: 1, uploaded_at: -1 });

export const Image = model<IImage, ImageModel>('Image', ImageSchema);
