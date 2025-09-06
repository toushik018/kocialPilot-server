import express from 'express';
import { MongoPdfController } from './mongo-pdf.controller';

const router = express.Router();

router.post('/', MongoPdfController.createDocument);

router.get('/documents', MongoPdfController.getAllDocuments);

router.get('/:id', MongoPdfController.getDocumentById);

router.patch('/:id', MongoPdfController.updateDocument);

router.delete('/:id', MongoPdfController.deleteDocument);

export const MongoPdfRoutes = router;
