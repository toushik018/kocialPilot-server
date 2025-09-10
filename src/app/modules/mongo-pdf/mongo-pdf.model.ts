import { Schema, model } from 'mongoose';
import { IMongoPdf, MongoPdfModel } from './mongo-pdf.interface';

const MongoPdfSchema = new Schema<IMongoPdf>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    textContent: {
      type: String,
    },
    summary: {
      type: String,
    },
    metadata: {
      pageCount: Number,
      author: String,
      subject: String,
      keywords: [String],
      creationDate: Date,
      modificationDate: Date,
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const MongoPdf = model<IMongoPdf, MongoPdfModel>(
  'MongoPdf',
  MongoPdfSchema
);
