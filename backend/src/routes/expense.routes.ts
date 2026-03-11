import { Router } from 'express';
import { createExpenseController, listExpensesController } from '../controllers/expense.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

export const expenseRouter = Router();

expenseRouter.post('/:id/expenses', authMiddleware, roleMiddleware(['USER', 'GESTOR']), createExpenseController);
expenseRouter.get('/:id/expenses', authMiddleware, listExpensesController);
