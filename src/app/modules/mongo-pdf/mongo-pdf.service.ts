import { IMongoPdf } from './mongo-pdf.interface';
import { MongoPdf } from './mongo-pdf.model';

const createDocument = async (payload: IMongoPdf): Promise<IMongoPdf> => {
  const result = await MongoPdf.create(payload);
  return result;
};

const getAllDocuments = async (): Promise<IMongoPdf[]> => {
  const result = await MongoPdf.find();
  return result;
};

const getDocumentById = async (id: string): Promise<IMongoPdf | null> => {
  const result = await MongoPdf.findById(id);
  return result;
};

const updateDocument = async (
  id: string,
  payload: Partial<IMongoPdf>
): Promise<IMongoPdf | null> => {
  const result = await MongoPdf.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  return result;
};

const deleteDocument = async (id: string): Promise<IMongoPdf | null> => {
  const result = await MongoPdf.findByIdAndDelete(id);
  return result;
};

export const MongoPdfService = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
