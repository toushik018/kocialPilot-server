import { Response } from 'express';
import httpStatus from 'http-status';
import { CustomRequest } from '../../interface/types';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { DraftsService } from './drafts.service';
import pick from '../../utils/pick';
import { paginationFields } from '../../constants/pagination';

const getDraftPosts = catchAsync<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const filters = pick(req.query, ['searchTerm', 'status', 'platform']);
    const paginationOptions = pick(req.query, paginationFields);
    const userId = req.user?.userId;

    const result = await DraftsService.getDrafts(
      filters,
      paginationOptions,
      userId
    );

    const transformed = result.data.map((post) => ({
      id: post._id?.toString() || '',
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      hashtags: post.hashtags || [],
      alt_text: post.alt_text,
      metadata: post.metadata,
      scheduled_date: post.scheduled_date
        ? new Date(post.scheduled_date).toISOString()
        : undefined,
      scheduled_time: post.scheduled_time,
      status: post.status,
      auto_scheduled: post.auto_scheduled || false,
      created_at: post.createdAt
        ? new Date(post.createdAt).toISOString()
        : new Date().toISOString(),
      updated_at: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : new Date().toISOString(),
      posted_at: undefined,
    }));

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Draft posts retrieved successfully',
      data: { meta: result.meta, data: transformed },
    });
  }
);

const deleteMultipleDraftPosts = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { postIds } = req.body as { postIds: string[] };

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Post IDs are required',
      });
    }

    const deletedPosts = await DraftsService.deleteMultipleDrafts(postIds);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `${deletedPosts.length} posts deleted successfully`,
      data: { deletedPosts },
    });
  }
);

const deleteSingleDraftPost = catchAsync(
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;

    const result = await DraftsService.deleteDraft(id);
    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Post not found',
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Post deleted successfully',
      data: result,
    });
  }
);

export const DraftsController = {
  getDraftPosts,
  deleteMultipleDraftPosts,
  deleteSingleDraftPost,
};
