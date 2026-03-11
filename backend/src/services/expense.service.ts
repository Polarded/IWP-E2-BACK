import { randomUUID } from 'node:crypto';
import type { Expense } from '../interfaces/expense.interface.js';

interface CreateExpenseInput {
  tripId: string;
  description: string;
  amount: number;
}

const expensesByTrip = new Map<string, Expense[]>();

export const createExpenseService = ({ tripId, description, amount }: CreateExpenseInput): Expense => {
  const expense: Expense = {
    id: randomUUID(),
    tripId,
    description,
    amount,
    createdAt: new Date().toISOString()
  };

  const current = expensesByTrip.get(tripId) ?? [];
  current.push(expense);
  expensesByTrip.set(tripId, current);

  return expense;
};

export const listExpensesByTripService = (tripId: string): Expense[] => {
  return expensesByTrip.get(tripId) ?? [];
};
