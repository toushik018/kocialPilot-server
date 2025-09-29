import { SortOrder } from 'mongoose';
import { paginationHelpers } from '../../helpers/paginationHelper';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOptions } from '../../interface/pagination';
import { cloudinary } from '../../middlewares/multer';
import {
  IMongoPost,
  IMongoPostFilters,
} from '../mongo-posts/mongo-posts.interface';
import { Post } from '../mongo-posts/mongo-posts.model';

// Get draft posts with filtering and pagination
const getDrafts = async (
  filters: IMongoPostFilters,
  paginationOptions: IPaginationOptions,
  userId?: string
): Promise<IGenericResponse<IMongoPost[]>> => {
  const { searchTerm, platform, ...filtersData } = filters;
  const andConditions: Array<Record<string, unknown>> = [];

  // Only draft status
  andConditions.push({ status: 'draft' });

  // Not deleted
  andConditions.push({ isDeleted: false });

  if (userId) {
    andConditions.push({ user_id: userId });
  }

  if (searchTerm) {
    andConditions.push({
      $or: ['caption', 'hashtags'].map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (platform) andConditions.push({ platform });

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) sortConditions[sortBy] = sortOrder;

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await Post.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(whereConditions);

  return {
    meta: { page, limit, total },
    data: result,
  };
};

// Delete a single draft post (soft delete) with user ownership check
const deleteDraft = async (
  id: string,
  userId: string
): Promise<IMongoPost | null> => {
  const result = await Post.findOneAndUpdate(
    { _id: id, user_id: userId, status: 'draft', isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  return result;
};

// Permanently delete a draft post (hard delete with Cloudinary cleanup)
const permanentlyDeleteDraft = async (
  id: string
): Promise<IMongoPost | null> => {
  const post = await Post.findById(id);
  if (!post) return null;

  // Delete image from Cloudinary if it exists
  if (post.image_url && post.image_url.includes('cloudinary.com')) {
    try {
      const urlParts = post.image_url.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // ignore cloudinary cleanup failure
    }
  }

  // Delete video from Cloudinary if it exists
  if (post.video_url && post.video_url.includes('cloudinary.com')) {
    try {
      const urlParts = post.video_url.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch {
      // ignore cloudinary cleanup failure
    }
  }

  const result = await Post.findByIdAndDelete(id);
  return result;
};

// Delete multiple draft posts (soft delete) with user ownership check
const deleteMultipleDrafts = async (
  postIds: string[],
  userId: string
): Promise<IMongoPost[]> => {
  await Post.updateMany(
    {
      _id: { $in: postIds },
      user_id: userId,
      status: 'draft',
      isDeleted: false,
    },
    { isDeleted: true }
  );
  return Post.find({ _id: { $in: postIds }, user_id: userId });
};

// Permanently delete multiple drafts
const permanentlyDeleteMultipleDrafts = async (
  postIds: string[]
): Promise<IMongoPost[]> => {
  const deleted: IMongoPost[] = [];
  for (const id of postIds) {
    const res = await permanentlyDeleteDraft(id);
    if (res) deleted.push(res);
  }
  return deleted;
};

export const DraftsService = {
  getDrafts,
  deleteDraft,
  deleteMultipleDrafts,
  permanentlyDeleteDraft,
  permanentlyDeleteMultipleDrafts,
};
