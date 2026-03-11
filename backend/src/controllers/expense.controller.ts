import type { NextFunction, Request, Response } from 'express';
import { createExpenseService, listExpensesByTripService } from '../services/expense.service.js';

export const createExpenseController = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const tripId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { description, amount } = req.body as {
      description: string;
      amount: number;
    };

    const expense = createExpenseService({
      tripId,
      description,
      amount
    });

    res.status(201).json({ ok: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const listExpensesController = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const tripId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const expenses = listExpensesByTripService(tripId);
    res.status(200).json({ ok: true, data: expenses });
  } catch (error) {
    next(error);
  }
};
