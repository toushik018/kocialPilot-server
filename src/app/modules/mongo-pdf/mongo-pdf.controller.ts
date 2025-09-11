import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../app/utils/catchAsync';
import { sendResponse } from '../../../app/utils/sendResponse';
import { IMongoPdf, IPdfAnalyzeRequest } from './mongo-pdf.interface';
import { MongoPdfService } from './mongo-pdf.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const createDocument = catchAsync(async (req: Request, res: Response) => {
  const { ...documentData } = req.body;
  const result = await MongoPdfService.createDocument(documentData);

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document created successfully',
    data: result,
  });
});

const getAllDocuments = catchAsync(async (req: Request, res: Response) => {
  const result = await MongoPdfService.getAllDocuments();

  sendResponse<IMongoPdf[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Documents retrieved successfully',
    data: result,
  });
});

const getDocumentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await MongoPdfService.getDocumentById(id);

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document retrieved successfully',
    data: result,
  });
});

const updateDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;

  const result = await MongoPdfService.updateDocument(id, updatedData);

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document updated successfully',
    data: result,
  });
});

const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await MongoPdfService.deleteDocument(id);

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document deleted successfully',
    data: result,
  });
});

const analyzeDocument = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'No PDF file provided',
      });
    }

    // Get userId from authenticated user
    const userId = req.user?.userId;
    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'User authentication required',
      });
    }

    const analyzeRequest: IPdfAnalyzeRequest = {
      userId: userId,
      additionalInfo: req.body.additionalInfo,
    };

    const result = await MongoPdfService.analyzeDocument(file, analyzeRequest);

    sendResponse<IMongoPdf>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'PDF analysis started successfully',
      data: result,
    });
  }
);

const getUserDocuments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'User ID is required',
    });
  }

  const result = await MongoPdfService.getAllDocumentsByUser(userId);

  sendResponse<IMongoPdf[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User documents retrieved successfully',
    data: result,
  });
});

export const MongoPdfController = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  analyzeDocument,
  getUserDocuments,
};
