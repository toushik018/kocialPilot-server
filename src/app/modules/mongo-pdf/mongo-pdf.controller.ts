import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../app/utils/catchAsync';
import { sendResponse } from '../../../app/utils/sendResponse';
import { IMongoPdf } from './mongo-pdf.interface';
import { MongoPdfService } from './mongo-pdf.service';

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

export const MongoPdfController = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
