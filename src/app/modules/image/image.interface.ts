import { Model, Types } from 'mongoose';

export type IImage = {
  _id?: Types.ObjectId;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  is_used: boolean;
  uploaded_at: Date;
  user_id: string;
};

export type ImageModel = Model<IImage>;

export type IImageFilters = {
  searchTerm?: string;
  filename?: string;
  user_id?: string;
};
