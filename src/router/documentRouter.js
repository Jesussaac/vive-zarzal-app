import { Router } from 'express';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  showEditDocument,
  updateDocument,
} from '../controllers/documentController.js';
import { requireAuth } from '../middlewares/auth.js';

export const documentRouter = Router();

documentRouter.get('/profile/documents', requireAuth, listDocuments);
documentRouter.post('/profile/documents', requireAuth, createDocument);
documentRouter.get('/profile/documents/:id/edit', requireAuth, showEditDocument);
documentRouter.post('/profile/documents/:id/edit', requireAuth, updateDocument);
documentRouter.post('/profile/documents/:id/delete', requireAuth, deleteDocument);
