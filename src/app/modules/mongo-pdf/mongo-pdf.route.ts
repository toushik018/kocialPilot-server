import express from 'express';
import multer from 'multer';
import auth from '../../middlewares/auth';
import { MongoPdfController } from './mongo-pdf.controller';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.post('/analyze', auth(), upload.single('pdf'), MongoPdfController.analyzeDocument);

router.post('/', MongoPdfController.createDocument);

router.get('/documents', MongoPdfController.getAllDocuments);

router.get('/user/:userId', MongoPdfController.getUserDocuments);

router.get('/:id', MongoPdfController.getDocumentById);

router.patch('/:id', MongoPdfController.updateDocument);

router.delete('/:id', MongoPdfController.deleteDocument);

export const MongoPdfRoutes = router;
