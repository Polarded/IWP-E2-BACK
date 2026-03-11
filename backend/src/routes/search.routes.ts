import { Router } from 'express';
import { searchFlightsController, searchHotelsController } from '../controllers/search.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const searchRouter = Router();

searchRouter.use(authMiddleware);
searchRouter.get('/flights', searchFlightsController);
searchRouter.get('/hotels', searchHotelsController);
