import { Router } from 'express';
import {
  assignRole,
  listUsers,
  removeRole,
} from '../controllers/adminUserController.js';
import { requirePermission } from '../middlewares/auth.js';

export const adminUsersRouter = Router();

// "roles:manage" solo lo tiene el rol admin (ver docs/PERMISSIONS.md).
const manageRoles = requirePermission('roles:manage');

adminUsersRouter.get('/admin/users', manageRoles, listUsers);
adminUsersRouter.post('/admin/users/:id/roles', manageRoles, assignRole);
adminUsersRouter.post(
  '/admin/users/:id/roles/:roleId/delete',
  manageRoles,
  removeRole
);
