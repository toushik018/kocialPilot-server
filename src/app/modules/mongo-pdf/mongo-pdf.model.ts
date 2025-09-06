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
