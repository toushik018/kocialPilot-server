import { SortOrder } from 'mongoose';
import { paginationHelpers } from '../../helpers/paginationHelper';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOptions } from '../../interface/pagination';
import {
  IMongoPost,
  IMongoPostFilters,
} from '../mongo-posts/mongo-posts.interface';
import { Post } from '../mongo-posts/mongo-posts.model';
import { cloudinary } from '../../middlewares/multer';

// Get recently deleted posts (soft-deleted)
const getRecentlyDeletedPosts = async (
  filters: IMongoPostFilters,
  paginationOptions: IPaginationOptions,
  userId?: string
): Promise<IGenericResponse<IMongoPost[]>> => {
  const { searchTerm, status, platform, ...filtersData } = filters;
  const andConditions: Array<Record<string, unknown>> = [];

  // Only soft-deleted
  andConditions.push({ isDeleted: true });

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

  if (status) andConditions.push({ status });
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

// Restore a soft-deleted post
const restorePost = async (id: string): Promise<IMongoPost | null> => {
  const result = await Post.findByIdAndUpdate(
    id,
    { isDeleted: false },
    { new: true }
  );
  return result;
};

// Permanently delete a post (hard delete with Cloudinary cleanup)
const permanentlyDeletePost = async (
  id: string
): Promise<IMongoPost | null> => {
  // First get the post to check for Cloudinary assets
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

  // Permanently delete from database
  const result = await Post.findByIdAndDelete(id);
  return result;
};

// Restore multiple posts
const restoreMultiplePosts = async (
  postIds: string[]
): Promise<IMongoPost[]> => {
  await Post.updateMany(
    { _id: { $in: postIds }, isDeleted: true },
    { isDeleted: false }
  );
  const updatedPosts = await Post.find({ _id: { $in: postIds } });
  return updatedPosts;
};

// Permanently delete multiple posts
const permanentlyDeleteMultiplePosts = async (
  postIds: string[]
): Promise<IMongoPost[]> => {
  const deletedPosts: IMongoPost[] = [];
  for (const id of postIds) {
    const post = await permanentlyDeletePost(id);
    if (post) deletedPosts.push(post);
  }
  return deletedPosts;
};

export const RecentDeleteService = {
  getRecentlyDeletedPosts,
  restorePost,
  permanentlyDeletePost,
  restoreMultiplePosts,
  permanentlyDeleteMultiplePosts,
};
