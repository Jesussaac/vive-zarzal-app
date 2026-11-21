import { Router } from 'express';
import {
    categoryAdmin,
    tagAdmin,
} from '../controllers/catalogAdminController.js';
import { requirePermission } from '../middlewares/auth.js';

export const adminRouter = Router();

const manageCategories = requirePermission('categories:manage');
const manageTags = requirePermission('tags:manage');

adminRouter.get('/admin/categories', manageCategories, categoryAdmin.list);
adminRouter.post('/admin/categories', manageCategories, categoryAdmin.create);
adminRouter.post('/admin/categories/:id/edit', manageCategories, categoryAdmin.update);
adminRouter.post('/admin/categories/:id/delete', manageCategories, categoryAdmin.remove);

adminRouter.get('/admin/tags', manageTags, tagAdmin.list);
adminRouter.post('/admin/tags', manageTags, tagAdmin.create);
adminRouter.post('/admin/tags/:id/edit', manageTags, tagAdmin.update);
adminRouter.post('/admin/tags/:id/delete', manageTags, tagAdmin.remove);