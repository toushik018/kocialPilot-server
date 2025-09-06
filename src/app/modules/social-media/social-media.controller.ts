import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../app/utils/catchAsync';
import { sendResponse } from '../../../app/utils/sendResponse';
import { ISocialMediaAccount } from './social-media.interface';
import { SocialMediaService } from './social-media.service';

const createAccount = catchAsync(async (req: Request, res: Response) => {
  const { ...accountData } = req.body;
  const result = await SocialMediaService.createAccount(accountData);

  sendResponse<ISocialMediaAccount>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social media account created successfully',
    data: result,
  });
});

const getAllAccounts = catchAsync(async (req: Request, res: Response) => {
  const result = await SocialMediaService.getAllAccounts();

  sendResponse<ISocialMediaAccount[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social media accounts retrieved successfully',
    data: result,
  });
});

const getAccountById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await SocialMediaService.getAccountById(id);

  sendResponse<ISocialMediaAccount>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social media account retrieved successfully',
    data: result,
  });
});

const updateAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;

  const result = await SocialMediaService.updateAccount(id, updatedData);

  sendResponse<ISocialMediaAccount>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social media account updated successfully',
    data: result,
  });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await SocialMediaService.deleteAccount(id);

  sendResponse<ISocialMediaAccount>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social media account deleted successfully',
    data: result,
  });
});

export const SocialMediaController = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};
