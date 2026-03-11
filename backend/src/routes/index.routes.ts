import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { expenseRouter } from './expense.routes.js';
import { searchRouter } from './search.routes.js';
import { tripRouter } from './trip.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/trips', tripRouter);
apiRouter.use('/trips', expenseRouter);
apiRouter.use('/search', searchRouter);
