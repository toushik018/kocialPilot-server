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
  const authUserId = (req as AuthenticatedRequest).user?.userId;
  if (!authUserId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User authentication required',
    });
  }
  const { ...documentData } = req.body;
  // Force owner to authenticated user
  const payload = {
    ...documentData,
    owner: authUserId,
  } as unknown as IMongoPdf;
  const result = await MongoPdfService.createDocument(payload);

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document created successfully',
    data: result,
  });
});

const getAllDocuments = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const result = await MongoPdfService.getAllDocuments(userId);

    sendResponse<IMongoPdf[]>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Documents retrieved successfully',
      data: result,
    });
  }
);

const getDocumentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const authUserId = (req as AuthenticatedRequest).user?.userId || '';
  const result = await MongoPdfService.getDocumentById(id, authUserId);

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
  const authUserId = (req as AuthenticatedRequest).user?.userId || '';

  const result = await MongoPdfService.updateDocument(
    id,
    updatedData,
    authUserId
  );

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document updated successfully',
    data: result,
  });
});

const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const authUserId = (req as AuthenticatedRequest).user?.userId || '';

  const result = await MongoPdfService.deleteDocument(id, authUserId);

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
  const authUserId = (req as AuthenticatedRequest).user?.userId;

  if (!authUserId || authUserId !== userId) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'Forbidden',
    });
  }

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

const getRecentlyDeletedDocuments = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const authUserId = (req as AuthenticatedRequest).user?.userId;

    if (!authUserId || authUserId !== userId) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: 'Forbidden',
      });
    }

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await MongoPdfService.getRecentlyDeletedDocuments(userId);

    sendResponse<IMongoPdf[]>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Recently deleted documents retrieved successfully',
      data: result,
    });
  }
);

const restoreDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await MongoPdfService.restoreDocument(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Document not found',
    });
  }

  sendResponse<IMongoPdf>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document restored successfully',
    data: result,
  });
});

const permanentlyDeleteDocument = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    const result = await MongoPdfService.permanentlyDeleteDocument(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Document not found',
      });
    }

    sendResponse<IMongoPdf>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Document permanently deleted successfully',
      data: result,
    });
  }
);

export const MongoPdfController = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  analyzeDocument,
  getUserDocuments,
  getRecentlyDeletedDocuments,
  restoreDocument,
  permanentlyDeleteDocument,
};
