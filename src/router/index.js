import { Router } from 'express';
import { authRouter } from './authRouter.js';
import { userRouter } from './userRouter.js';
import { publicationRouter } from './publicationRouter.js';
import { interactionRouter } from './interactionRouter.js';
import { adminRouter } from './adminRouter.js';
import { adminUsersRouter } from './adminUsersRouter.js';
import { adminReportsRouter } from './adminReportsRouter.js';

const router = Router();

router.use(authRouter);
router.use(userRouter);
router.use(publicationRouter);
router.use(interactionRouter);
router.use(adminRouter);
router.use(adminUsersRouter);
router.use(adminReportsRouter);

export default router;