import { SortOrder, Types } from 'mongoose';
import { paginationHelpers } from '../../helpers/paginationHelper';
import { IGenericResponse } from '../../interface/common';
import { IPaginationOptions } from '../../interface/pagination';
import { IMongoPost, IMongoPostFilters } from './mongo-posts.interface';
import { Post } from './mongo-posts.model';
import { cloudinary } from '../../middlewares/multer';

// Get user's schedule
const getUserSchedule = async (userId: string) => {
  try {
    // Import dynamically to avoid circular dependency
    const { Schedule } = await import('../schedule/schedule.model');
    const schedule = await Schedule.findOne({
      user_id: userId,
      is_active: true,
    });
    return schedule;
  } catch (error) {
    // Using throw instead of console.error
    throw new Error(`Error getting user schedule: ${error}`);
  }
};

interface ISchedule {
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  days?: string[];
  selected_dates?: string[];
}

// Calculate next scheduled date based on frequency
const calculateNextScheduledDate = (schedule: ISchedule) => {
  const now = new Date();
  let scheduledDate = new Date();

  // Set time from schedule
  const [hours, minutes] = schedule.time.split(':').map(Number);
  scheduledDate.setHours(hours, minutes, 0, 0);

  // If time is in the past, move to next day
  if (scheduledDate < now) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  // Adjust based on frequency
  switch (schedule.frequency) {
    case 'daily':
      // Already set for next available day
      break;

    case 'weekly':
      if (schedule.days && schedule.days.length > 0) {
        // Find the next day that matches one in the schedule
        const daysOfWeek = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];
        const currentDayIndex = scheduledDate.getDay();

        // Convert schedule days to day indices
        const scheduleDayIndices = schedule.days.map((day) =>
          daysOfWeek.indexOf(day.toLowerCase())
        );

        // Find the next scheduled day
        let daysToAdd = 1;
        let nextDayIndex = (currentDayIndex + daysToAdd) % 7;

        while (!scheduleDayIndices.includes(nextDayIndex)) {
          daysToAdd++;
          nextDayIndex = (currentDayIndex + daysToAdd) % 7;

          // Prevent infinite loop
          if (daysToAdd > 7) break;
        }

        scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
      } else {
        // Default to one week from now
        scheduledDate.setDate(scheduledDate.getDate() + 7);
      }
      break;

    case 'monthly':
      // Set to same day next month
      scheduledDate.setMonth(scheduledDate.getMonth() + 1);
      break;

    case 'custom':
      if (schedule.selected_dates && schedule.selected_dates.length > 0) {
        // Find the next date from selected_dates that is in the future
        const futureDates = schedule.selected_dates
          .map((date: string) => new Date(date))
          .filter((date: Date) => date > now)
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        if (futureDates.length > 0) {
          scheduledDate = futureDates[0];
          // Set the time from schedule
          scheduledDate.setHours(hours, minutes, 0, 0);
        }
      }
      break;

    default:
      // Default to tomorrow
      scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return scheduledDate;
};

// Create a new post directly with generated content (no image upload here)
const createPostWithGeneratedContent = async (
  imageData: { file_path: string; image_url: string },
  postData: {
    caption: string;
    hashtags: string[];
    alt_text: string;
  },
  userId: string,
  userEmail: string,
  username: string
): Promise<IMongoPost> => {
  try {
    // Get user's schedule
    const userSchedule = await getUserSchedule(userId);

    // Get latest scheduled post
    const latestPost = await Post.findOne({
      user_id: userId,
      status: 'scheduled',
    }).sort({ scheduled_date: -1 });

    // Determine next available date
    let startDate = new Date();
    if (latestPost && latestPost.scheduled_date) {
      startDate = new Date(latestPost.scheduled_date);
      startDate.setDate(startDate.getDate() + 1);
    }

    const scheduledDate = await findNextAvailableDate(
      userId,
      startDate,
      userSchedule?.time || '09:00'
    );

    // Create the post
    const newPost: Partial<IMongoPost> = {
      user_id: userId,
      username,
      email: userEmail,
      image_url: imageData.image_url,
      image_path: imageData.file_path,
      caption: postData.caption || '',
      hashtags: postData.hashtags || [],
      alt_text: postData.alt_text || '',
      scheduled_date: scheduledDate,
      scheduled_time: userSchedule?.time || '09:00',
      status: 'scheduled',
      auto_scheduled: !!userSchedule,
    };

    const createdPost = await Post.create(newPost);
    return createdPost;
  } catch (error) {
    throw new Error(`Error creating post with generated content: ${error}`);
  }
};

// Helper function to find the next available date
const findNextAvailableDate = async (
  userId: string,
  startDate: Date,
  preferredTime?: string
): Promise<Date> => {
  const checkDate = new Date(startDate);
  checkDate.setHours(0, 0, 0, 0);

  while (true) {
    // Check if this date already has a post
    const existingPost = await Post.findOne({
      user_id: userId,
      status: 'scheduled',
      scheduled_date: {
        $gte: new Date(checkDate.setHours(0, 0, 0, 0)),
        $lt: new Date(checkDate.setHours(23, 59, 59, 999)),
      },
    });

    if (!existingPost) {
      // No post found for this date, it's available
      const availableDate = new Date(checkDate);
      if (preferredTime) {
        const [hours, minutes] = preferredTime.split(':').map(Number);
        availableDate.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        // Default to 9:00 AM if no preferred time
        availableDate.setHours(9, 0, 0, 0);
      }
      return availableDate;
    }

    // Move to next day and check again
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(0, 0, 0, 0);
  }
};

// Create post with one-post-per-day constraint
const createPost = async (payload: IMongoPost): Promise<IMongoPost> => {
  try {
    // If a schedule date is specified
    if (payload.scheduled_date) {
      const nextAvailableDate = await findNextAvailableDate(
        payload.user_id,
        new Date(payload.scheduled_date),
        payload.scheduled_time
      );

      payload.scheduled_date = nextAvailableDate;
      if (!payload.scheduled_time) {
        payload.scheduled_time = '09:00';
      }
    }

    // Get user's schedule for auto-scheduling if no date specified
    if (!payload.scheduled_date) {
      const userSchedule = await getUserSchedule(payload.user_id);
      if (userSchedule) {
        // Get latest scheduled post
        const latestPost = await Post.findOne({
          user_id: payload.user_id,
          status: 'scheduled',
        }).sort({ scheduled_date: -1 });

        let startDate = new Date();
        if (latestPost && latestPost.scheduled_date) {
          startDate = new Date(latestPost.scheduled_date);
          startDate.setDate(startDate.getDate() + 1);
        }

        const nextAvailableDate = await findNextAvailableDate(
          payload.user_id,
          startDate,
          userSchedule.time
        );

        payload.scheduled_date = nextAvailableDate;
        payload.scheduled_time = userSchedule.time;
        payload.auto_scheduled = true;
      }
    }

    const result = await Post.create(payload);
    return result;
  } catch (error) {
    throw new Error(`Error creating post: ${error}`);
  }
};

// Keep the old createPostWithImage for backward compatibility but update to use Post model
const createPostWithImage = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any,
  postData: Partial<IMongoPost>,
  userId: string,
  userEmail: string,
  username: string
): Promise<IMongoPost> => {
  try {
    // Get user's schedule
    const userSchedule = await getUserSchedule(userId);

    // Get latest scheduled post
    const latestPost = await Post.findOne({
      user_id: userId,
      status: 'scheduled',
    }).sort({ scheduled_date: -1 });

    // Determine next available date
    let startDate = new Date();
    if (latestPost && latestPost.scheduled_date) {
      startDate = new Date(latestPost.scheduled_date);
      startDate.setDate(startDate.getDate() + 1);
    }

    const scheduledDate = await findNextAvailableDate(
      userId,
      startDate,
      userSchedule?.time || '09:00'
    );

    const newPost: Partial<IMongoPost> = {
      user_id: userId,
      username,
      email: userEmail,
      image_url: postData.image_url,
      image_path: postData.image_path,
      caption: postData.caption || '',
      hashtags: postData.hashtags || [],
      alt_text: postData.alt_text || '',
      scheduled_date: scheduledDate,
      scheduled_time: userSchedule?.time || '09:00',
      status: 'scheduled',
      auto_scheduled: !!userSchedule,
    };

    const createdPost = await Post.create(newPost);
    return createdPost;
  } catch (error) {
    throw new Error(`Error creating post with image: ${error}`);
  }
};

const getAllPosts = async (
  filters: IMongoPostFilters,
  paginationOptions: IPaginationOptions,
  userId?: string
): Promise<IGenericResponse<IMongoPost[]>> => {
  try {
    const { searchTerm, status, platform, ...filtersData } = filters;
    const andConditions = [];

    // Exclude soft-deleted posts by default
    andConditions.push({ isDeleted: { $ne: true } });

    // Add userId filter if provided
    if (userId) {
      andConditions.push({ user_id: userId });
    }

    if (searchTerm) {
      andConditions.push({
        $or: ['caption', 'hashtags'].map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (platform) {
      andConditions.push({ platform });
    }

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

    if (sortBy && sortOrder) {
      sortConditions[sortBy] = sortOrder;
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const result = await Post.find(whereConditions)
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  } catch (error) {
    throw new Error(`Error getting all posts: ${error}`);
  }
};

const getDraftPosts = async (): Promise<IMongoPost[]> => {
  try {
    const result = await Post.find({
      status: 'draft',
      isDeleted: { $ne: true },
    });
    return result;
  } catch (error) {
    throw new Error(`Error getting draft posts: ${error}`);
  }
};

const getPostById = async (
  id: string,
  userId: string
): Promise<IMongoPost | null> => {
  try {
    const result = await Post.findOne({
      _id: id,
      user_id: userId,
      isDeleted: { $ne: true },
    });
    return result;
  } catch (error) {
    throw new Error(`Error getting post by ID: ${error}`);
  }
};

const updatePost = async (
  id: string,
  payload: Partial<IMongoPost>,
  userId: string
): Promise<IMongoPost | null> => {
  try {
    // Convert string ID to ObjectId if needed
    const objectId = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;

    const result = await Post.findOneAndUpdate(
      { _id: objectId, user_id: userId, isDeleted: { $ne: true } },
      payload,
      { new: true }
    );

    return result;
  } catch (error) {
    throw new Error(`Error updating post: ${error}`);
  }
};

const deletePost = async (
  id: string,
  userId: string
): Promise<IMongoPost | null> => {
  try {
    // First get the post to check for Cloudinary assets
    const post = await Post.findOne({ _id: id, user_id: userId });
    if (!post) {
      return null;
    }

    // Delete image from Cloudinary if it exists
    if (post.image_url && post.image_url.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = post.image_url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(
          'Failed to delete image from Cloudinary:',
          cloudinaryError
        );
        // Continue execution even if Cloudinary deletion fails
      }
    }

    // Delete video from Cloudinary if it exists
    if (post.video_url && post.video_url.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = post.video_url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (cloudinaryError) {
        console.error(
          'Failed to delete video from Cloudinary:',
          cloudinaryError
        );
        // Continue execution even if Cloudinary deletion fails
      }
    }

    // Perform soft delete by setting isDeleted to true and deletedAt timestamp
    const result = await Post.findOneAndUpdate(
      { _id: id, user_id: userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Error deleting post: ${error}`);
  }
};

// Add hard delete function for permanent removal
const hardDeletePost = async (id: string): Promise<IMongoPost | null> => {
  try {
    const result = await Post.findByIdAndDelete(id);
    return result;
  } catch (error) {
    throw new Error(`Error hard deleting post: ${error}`);
  }
};

const getCalendarPosts = async (
  year: number,
  month: number,
  userId?: string
): Promise<IMongoPost[]> => {
  try {
    // MongoDB aggregation to get posts for a specific month and year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const conditions: Record<string, unknown> = {
      $or: [
        {
          status: 'scheduled',
          scheduled_date: { $gte: startDate, $lte: endDate },
        },
        {
          status: 'published',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      ],
      isDeleted: { $ne: true },
    };

    // Add userId filter if provided
    if (userId) {
      conditions.user_id = userId;
    }

    const result = await Post.find(conditions);

    return result;
  } catch (error) {
    throw new Error(`Error getting calendar posts: ${error}`);
  }
};

// Get recently deleted posts
const getRecentlyDeletedPosts = async (
  filters: IMongoPostFilters,
  paginationOptions: IPaginationOptions,
  userId?: string
): Promise<IGenericResponse<IMongoPost[]>> => {
  try {
    const { searchTerm, status, platform, ...filtersData } = filters;
    const andConditions = [];

    // Only get soft-deleted posts
    andConditions.push({ isDeleted: true });

    // Add userId filter if provided
    if (userId) {
      andConditions.push({ user_id: userId });
    }

    if (searchTerm) {
      andConditions.push({
        $or: ['caption', 'hashtags'].map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (platform) {
      andConditions.push({ platform });
    }

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

    if (sortBy && sortOrder) {
      sortConditions[sortBy] = sortOrder;
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const result = await Post.find(whereConditions)
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  } catch (error) {
    throw new Error(`Error getting recently deleted posts: ${error}`);
  }
};

// Restore a soft-deleted post
const restorePost = async (id: string): Promise<IMongoPost | null> => {
  try {
    const result = await Post.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error(`Error restoring post: ${error}`);
  }
};

// Permanently delete a post (hard delete with Cloudinary cleanup)
const permanentlyDeletePost = async (
  id: string
): Promise<IMongoPost | null> => {
  try {
    // First get the post to check for Cloudinary assets
    const post = await Post.findById(id);
    if (!post) {
      return null;
    }

    // Delete image from Cloudinary if it exists
    if (post.image_url && post.image_url.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = post.image_url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(
          'Failed to delete image from Cloudinary:',
          cloudinaryError
        );
        // Continue execution even if Cloudinary deletion fails
      }
    }

    // Delete video from Cloudinary if it exists
    if (post.video_url && post.video_url.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = post.video_url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (cloudinaryError) {
        console.error(
          'Failed to delete video from Cloudinary:',
          cloudinaryError
        );
        // Continue execution even if Cloudinary deletion fails
      }
    }

    // Permanently delete from database
    const result = await Post.findByIdAndDelete(id);
    return result;
  } catch (error) {
    throw new Error(`Error permanently deleting post: ${error}`);
  }
};

// Restore multiple posts
const restoreMultiplePosts = async (
  postIds: string[]
): Promise<IMongoPost[]> => {
  try {
    await Post.updateMany(
      { _id: { $in: postIds }, isDeleted: true },
      { isDeleted: false }
    );

    // Return the updated posts
    const updatedPosts = await Post.find({ _id: { $in: postIds } });
    return updatedPosts;
  } catch (error) {
    throw new Error(`Error restoring multiple posts: ${error}`);
  }
};

// Permanently delete multiple posts
const permanentlyDeleteMultiplePosts = async (
  postIds: string[]
): Promise<IMongoPost[]> => {
  try {
    const deletedPosts: IMongoPost[] = [];

    for (const id of postIds) {
      const post = await permanentlyDeletePost(id);
      if (post) {
        deletedPosts.push(post);
      }
    }

    return deletedPosts;
  } catch (error) {
    throw new Error(`Error permanently deleting multiple posts: ${error}`);
  }
};

export const MongoPostService = {
  createPost,
  createPostWithImage,
  createPostWithGeneratedContent, // New method
  getAllPosts,
  getDraftPosts,
  getPostById,
  updatePost,
  deletePost,
  hardDeletePost,
  getCalendarPosts,
  getUserSchedule,
  calculateNextScheduledDate,
  getRecentlyDeletedPosts,
  restorePost,
  permanentlyDeletePost,
  restoreMultiplePosts,
  permanentlyDeleteMultiplePosts,
};
