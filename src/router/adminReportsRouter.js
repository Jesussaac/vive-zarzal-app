import { Router } from 'express';
import {
  approveReport,
  dismissReport,
  listReports,
  showReport,
} from '../controllers/adminReportController.js';
import { requirePermission } from '../middlewares/auth.js';

export const adminReportsRouter = Router();

const manageReports = requirePermission('reports:manage');

adminReportsRouter.get('/admin/reports', manageReports, listReports);
adminReportsRouter.get('/admin/reports/:id', manageReports, showReport);
adminReportsRouter.post('/admin/reports/:id/approve', manageReports, approveReport);
adminReportsRouter.post('/admin/reports/:id/dismiss', manageReports, dismissReport);
