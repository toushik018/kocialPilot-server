import { Response } from 'express';

import httpStatus from 'http-status';
import { CustomRequest } from '../../interface/types';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ImageService } from './image.service';

interface RequestWithFile extends CustomRequest {
  file?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const uploadImage = catchAsync(async (req: RequestWithFile, res: Response) => {
  const file = req.file;
  const userId = req.user?.userId;

  if (!file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const result = await ImageService.saveImage(file, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Image uploaded successfully',
    data: result,
  });
});

const getAllImages = catchAsync(async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const result = await ImageService.getAllImages(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Images retrieved successfully',
    data: result,
  });
});

const getImageById = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const result = await ImageService.getImageById(id);

  if (!result) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Image not found',
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Image retrieved successfully',
    data: result,
  });
});

const deleteImage = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const result = await ImageService.deleteImage(id);

  if (!result) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Image not found',
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Image deleted successfully',
    data: result,
  });
});

export const ImageController = {
  uploadImage,
  getAllImages,
  getImageById,
  deleteImage,
};
