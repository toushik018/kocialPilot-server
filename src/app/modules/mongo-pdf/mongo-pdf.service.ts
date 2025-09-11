import { IMongoPdf, IPdfAnalyzeRequest } from './mongo-pdf.interface';
import { MongoPdf } from './mongo-pdf.model';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import pdfParse from 'pdf-parse';
import { User } from '../auth/auth.model';
import { Types } from 'mongoose';
import { OpenAI } from 'openai';
import config from '../../config';

const createDocument = async (payload: IMongoPdf): Promise<IMongoPdf> => {
  const result = await MongoPdf.create(payload);
  return result;
};

const getAllDocuments = async (userId?: string): Promise<IMongoPdf[]> => {
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (userId) {
    filter.owner = userId;
  }
  const result = await MongoPdf.find(filter);
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
  const document = await MongoPdf.findById(id);
  if (document && document.fileUrl) {
    // Extract public_id from Cloudinary URL for deletion
    const urlParts = document.fileUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
    }
  }

  const result = await MongoPdf.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  return result;
};

const analyzeDocument = async (
  file: {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype: string;
  },
  analyzeRequest: IPdfAnalyzeRequest
): Promise<IMongoPdf> => {
  try {
    // Validate PDF file
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('Invalid PDF file: empty buffer');
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'raw',
              folder: 'pdf-documents',
              public_id: `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error('Upload failed'));
            }
          )
          .end(file.buffer);
      }
    );

    // Extract text from PDF with better error handling
    let pdfData;
    let textContent = '';
    try {
      pdfData = await pdfParse(file.buffer);
      textContent = pdfData.text || '';
    } catch (parseError) {
      console.warn(
        'PDF parsing failed, continuing with empty text:',
        parseError
      );
      // Continue with empty text content instead of failing completely
      pdfData = { numpages: 0, info: {} };
    }

    // Get user info for personalized summary
    const user = await User.findById(analyzeRequest.userId);
    const userContext = user ? `User: ${user.name || user.email}` : '';
    const additionalContext = analyzeRequest.additionalInfo || '';

    // Generate AI summary (you'll need to implement this with your AI service)
    const summaryPrompt = `
      Please create a comprehensive summary of this PDF document.
      ${userContext ? `Context: ${userContext}` : ''}
      ${additionalContext ? `Additional Info: ${additionalContext}` : ''}
      
      Document Text:
      ${textContent.substring(0, 4000)} // Limit text for API
    `;

    // Helper function to parse PDF date format
    const parsePdfDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
        // Example: D:20090401163925-07'00'
        const match = dateStr.match(
          /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
        );
        if (match) {
          const [, year, month, day, hour, minute, second] = match;
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          );
        }
        // Fallback: try to parse as regular date
        return new Date(dateStr);
      } catch (error) {
        console.warn('Failed to parse PDF date:', dateStr, error);
        return undefined;
      }
    };

    // Create document record
    const documentData: IMongoPdf = {
      title: file.originalname.replace('.pdf', ''),
      fileUrl: uploadResult.secure_url,
      fileSize: file.size,
      fileType: file.mimetype,
      owner: new Types.ObjectId(analyzeRequest.userId),
      textContent,
      summary: 'Processing...', // Will be updated after AI processing
      metadata: {
        pageCount: pdfData.numpages,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        keywords: pdfData.info?.Keywords
          ? pdfData.info.Keywords.split(',')
          : [],
        creationDate: parsePdfDate(pdfData.info?.CreationDate),
        modificationDate: parsePdfDate(pdfData.info?.ModDate),
      },
      analysisStatus: 'processing',
      isDeleted: false,
    };

    const result = await MongoPdf.create(documentData);

    // Process AI summary in background (you can implement queue here)
    processAISummary(result._id!.toString(), summaryPrompt);

    return result;
  } catch (error) {
    throw new Error(`PDF analysis failed: ${error}`);
  }
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const processAISummary = async (documentId: string, prompt: string) => {
  try {
    // Call OpenAI API to generate summary
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert document analyzer. Create comprehensive, well-structured summaries of PDF documents. Focus on key points, main themes, and important details. Keep the summary informative yet concise.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const summary =
      response.choices[0]?.message?.content || 'Summary generation failed';

    await MongoPdf.findByIdAndUpdate(documentId, {
      summary,
      analysisStatus: 'completed',
    });
  } catch (error) {
    console.error('AI summary generation failed:', error);
    await MongoPdf.findByIdAndUpdate(documentId, {
      summary: 'AI summary generation failed. Please try again.',
      analysisStatus: 'failed',
    });
  }
};

const getAllDocumentsByUser = async (userId: string): Promise<IMongoPdf[]> => {
  const result = await MongoPdf.find({
    owner: userId,
    isDeleted: false,
  }).populate('owner', 'name email');
  return result;
};

const getRecentlyDeletedDocuments = async (
  userId: string
): Promise<IMongoPdf[]> => {
  const result = await MongoPdf.find({
    owner: userId,
    isDeleted: true,
  }).populate('owner', 'name email');
  return result;
};

const restoreDocument = async (id: string): Promise<IMongoPdf | null> => {
  const result = await MongoPdf.findByIdAndUpdate(
    id,
    { isDeleted: false },
    { new: true }
  );
  return result;
};

const permanentlyDeleteDocument = async (
  id: string
): Promise<IMongoPdf | null> => {
  const document = await MongoPdf.findById(id);
  if (document && document.fileUrl) {
    // Extract public_id from Cloudinary URL for deletion
    const urlParts = document.fileUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
    }
  }

  const result = await MongoPdf.findByIdAndDelete(id);
  return result;
};

export const MongoPdfService = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  analyzeDocument,
  getAllDocumentsByUser,
  getRecentlyDeletedDocuments,
  restoreDocument,
  permanentlyDeleteDocument,
};
