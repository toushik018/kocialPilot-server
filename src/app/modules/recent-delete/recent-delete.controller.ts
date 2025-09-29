import httpStatus from 'http-status';
import { Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import pick from '../../utils/pick';
import { sendResponse } from '../../utils/sendResponse';
import { paginationFields } from '../../constants/pagination';
import { CustomRequest } from '../../interface/types';
import { RecentDeleteService } from './recent-delete.service';
import { idsArraySchema } from './recent-delete.validation';
import { IMongoPost } from '../mongo-posts/mongo-posts.interface';

const getRecentlyDeletedPosts = catchAsync<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'status',
      'platform',
    ]);
    const paginationOptions = pick(req.query, paginationFields);
    const userId = req.user?.userId;

    const result = await RecentDeleteService.getRecentlyDeletedPosts(
      filters,
      paginationOptions,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Recently deleted posts retrieved successfully',
      data: result,
    });
  }
);

const restorePost = catchAsync<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const id = req.params.id;
    const result = await RecentDeleteService.restorePost(
      id,
      req.user?.userId || ''
    );

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Post not found',
      });
    }

    sendResponse<IMongoPost>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Post restored successfully',
      data: result,
    });
  }
);

const permanentlyDeletePost = catchAsync<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const id = req.params.id;
    const result = await RecentDeleteService.permanentlyDeletePost(
      id,
      req.user?.userId || ''
    );

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Post not found',
      });
    }

    sendResponse<IMongoPost>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Post permanently deleted successfully',
      data: result,
    });
  }
);

const restoreMultiplePosts = catchAsync<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const parsed = idsArraySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
    }

    const { postIds } = parsed.data;
    const restoredPosts = await RecentDeleteService.restoreMultiplePosts(
      postIds,
      req.user?.userId || ''
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `${restoredPosts.length} posts restored successfully`,
      data: { restoredPosts },
    });
  }
);

const permanentlyDeleteMultiplePosts = catchAsync<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const parsed = idsArraySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
    }

    const { postIds } = parsed.data;
    const deletedPosts =
      await RecentDeleteService.permanentlyDeleteMultiplePosts(
        postIds,
        req.user?.userId || ''
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `${deletedPosts.length} posts permanently deleted successfully`,
      data: { deletedPosts },
    });
  }
);

export const RecentDeleteController = {
  getRecentlyDeletedPosts,
  restorePost,
  permanentlyDeletePost,
  restoreMultiplePosts,
  permanentlyDeleteMultiplePosts,
};
