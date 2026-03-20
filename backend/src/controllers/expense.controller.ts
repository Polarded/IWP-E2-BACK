import type { NextFunction, Request, Response } from 'express';
import { createExpenseService, listExpensesByTripService } from '../services/expense.service.js';

export const createExpenseController = (req: Request, res: Response, next: NextFunction): void => {
  (async () => {
    const user = req.user;
    if (!user) {
      throw Object.assign(new Error('No autenticado'), { statusCode: 401 });
    }

    const tripId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { description, amount } = req.body as {
      description: string;
      amount: number;
      ticketImageUrl?: string;
    };
    const { ticketImageUrl } = req.body as { ticketImageUrl?: string };

    const expense = await createExpenseService({
      tripId,
      userId: user.id,
      description,
      amount,
      ticketImageUrl
    });

    res.status(201).json({ ok: true, data: expense });
  })().catch(next);
};

export const listExpensesController = (req: Request, res: Response, next: NextFunction): void => {
  (async () => {
    const tripId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const expenses = await listExpensesByTripService(tripId);
    res.status(200).json({ ok: true, data: expenses });
  })().catch(next);
};
