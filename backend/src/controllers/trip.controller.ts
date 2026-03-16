import type { NextFunction, Request, Response } from 'express';
import { createTripService, listTripsService, updateTripStatusService } from '../services/trip.service.js';
import type { TripStatus } from '../interfaces/trip.interface.js';

export const createTripController = (req: Request, res: Response, next: NextFunction): void => {
  (async () => {

    const user = req.user; // 🔵 agregado para tipado seguro

    if (!user) {
      throw Object.assign(new Error('No autenticado'), { statusCode: 401 });
    }

    const { destination, reason, startDate, endDate } = req.body as {
      destination: string;
      reason: string;
      startDate: string;
      endDate: string;
    };

    const trip = await createTripService({
      requesterId: user.id,
      destination,
      reason,
      startDate,
      endDate
    });

    res.status(201).json({ ok: true, data: trip });

  })().catch(next);
};

export const listTripsController = (req: Request, res: Response, next: NextFunction): void => {
  (async () => {

    const user = req.user; // 🔵 agregado

    if (!user) {
      throw Object.assign(new Error('No autenticado'), { statusCode: 401 });
    }

    const trips = await listTripsService({
      userId: user.id,
      role: user.role
    });

    res.status(200).json({ ok: true, data: trips });

  })().catch(next);
};

export const updateTripStatusController = (req: Request, res: Response, next: NextFunction): void => {
  (async () => {

    const user = req.user; // 🔵 agregado

    if (!user) {
      throw Object.assign(new Error('No autenticado'), { statusCode: 401 });
    }

    const tripId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const { status, comment } = req.body as {
      status: TripStatus;
      comment?: string;
    };

    const trip = await updateTripStatusService({
      tripId,
      role: user.role,
      nextStatus: status,
      comment
    });

    res.status(200).json({ ok: true, data: trip });

  })().catch(next);
};