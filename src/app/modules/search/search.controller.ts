import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import SearchService from './search.service';

const globalSearch = catchAsync(async (req: Request, res: Response) => {
  const { query, type = 'all', limit = 10, offset = 0 } = req.query;

  if (!query || typeof query !== 'string') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Search query is required',
      data: null,
    });
  }

  const searchQuery = {
    query: query as string,
    type: type as 'all' | 'post' | 'video' | 'image' | 'user',
    limit: parseInt(limit as string) || 10,
    offset: parseInt(offset as string) || 0,
  };

  const result = await SearchService.globalSearch(searchQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Search results retrieved successfully',
    data: result,
  });
});

const getPopularSearches = catchAsync(async (req: Request, res: Response) => {
  const result = await SearchService.getPopularSearches();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Popular searches retrieved successfully',
    data: result,
  });
});

const getSuggestions = catchAsync(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'No suggestions available',
      data: [],
    });
  }

  const searchQuery = {
    query: query as string,
    type: 'all' as const,
    limit: 5,
    offset: 0,
  };

  const result = await SearchService.globalSearch(searchQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Search suggestions retrieved successfully',
    data: result.results,
  });
});

export const SearchController = {
  globalSearch,
  getPopularSearches,
  getSuggestions,
};