import { Model, Types } from 'mongoose';

export type IMongoPdf = {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  owner: Types.ObjectId;
  textContent?: string;
  summary?: string;
  metadata?: {
    pageCount?: number;
    author?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: Date;
    modificationDate?: Date;
  };
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MongoPdfModel = Model<IMongoPdf>;

export type IPdfAnalyzeRequest = {
  userId: string;
  additionalInfo?: string;
};
