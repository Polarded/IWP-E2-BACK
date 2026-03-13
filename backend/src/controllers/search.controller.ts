import type { NextFunction, Request, Response } from 'express';
import { searchFlightsService, searchHotelsService } from '../services/serpapi.service.js';

export const searchFlightsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as Record<string, string | undefined>;
    const origin = query.origin ?? query.departure_id;
    const destination = query.destination ?? query.arrival_id;
    const outboundDate = query.outboundDate ?? query.outbound_date;
    const returnDate = query.returnDate ?? query.return_date;

    if (!origin || !destination || !outboundDate) {
      throw Object.assign(
        new Error('Faltan parámetros requeridos: origin/departure_id, destination/arrival_id, outboundDate/outbound_date'),
        { statusCode: 400 }
      );
    }

    const data = await searchFlightsService(origin, destination, outboundDate, returnDate);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export const searchHotelsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, checkInDate, checkOutDate } = req.query as Record<string, string>;
    const data = await searchHotelsService(query, checkInDate, checkOutDate);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};
