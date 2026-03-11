import type { NextFunction, Request, Response } from 'express';
import { searchFlightsService, searchHotelsService } from '../services/serpapi.service.js';

export const searchFlightsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { origin, destination, outboundDate } = req.query as Record<string, string>;
    const data = await searchFlightsService(origin, destination, outboundDate);
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
