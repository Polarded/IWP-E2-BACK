import { Router } from 'express';
import {
  createTripController,
  listTripsController,
  updateTripStatusController
} from '../controllers/trip.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

export const tripRouter = Router();

tripRouter.use(authMiddleware);
tripRouter.get('/', listTripsController);
tripRouter.post('/', roleMiddleware(['USER']), createTripController);
tripRouter.put('/:id/status', roleMiddleware(['GESTOR', 'FINANZAS']), updateTripStatusController);
