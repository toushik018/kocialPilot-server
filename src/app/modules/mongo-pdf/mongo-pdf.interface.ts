import { Model, Types } from 'mongoose';

export type IMongoPdf = {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  owner: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MongoPdfModel = Model<IMongoPdf>;
