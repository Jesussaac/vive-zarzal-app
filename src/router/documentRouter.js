import { Router } from 'express';
import {
  createDocument,
  deleteDocument,
  downloadDocumentSupport,
  listDocuments,
  loadOwnDocument,
  showEditDocument,
  updateDocument,
  uploadDocumentSupport,
} from '../controllers/documentController.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadSupport } from '../middlewares/uploadSupport.js';

export const documentRouter = Router();

documentRouter.get('/profile/documents', requireAuth, listDocuments);
documentRouter.post('/profile/documents', requireAuth, createDocument);
documentRouter.get('/profile/documents/:id/edit', requireAuth, showEditDocument);
documentRouter.post('/profile/documents/:id/edit', requireAuth, updateDocument);
documentRouter.post('/profile/documents/:id/delete', requireAuth, deleteDocument);
documentRouter.get('/profile/documents/:id/support', requireAuth, downloadDocumentSupport);
documentRouter.post(
  '/profile/documents/:id/support',
  requireAuth,
  loadOwnDocument,
  uploadSupport,
  uploadDocumentSupport
);