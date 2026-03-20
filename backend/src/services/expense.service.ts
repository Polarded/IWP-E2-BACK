import { supabaseAdmin } from '../config/db.config.js';
import type { Expense } from '../interfaces/expense.interface.js';

interface CreateExpenseInput {
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  ticketImageUrl?: string;
}

interface ExpenseRow {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  ticket_image_url: string | null;
  created_at: string;
}

const normalizeSupabaseErrorMessage = (message?: string): string => {
  const fallback = 'Error en la base de datos de gastos';
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (
    lower.includes("could not find the table 'public.gastos_viaje' in the schema cache") ||
    lower.includes('relation "gastos_viaje" does not exist')
  ) {
    return 'La tabla public.gastos_viaje no existe. Crea la tabla de gastos en Supabase y recarga schema.';
  }

  return message;
};

const toExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  tripId: row.trip_id,
  description: row.description,
  amount: row.amount,
  ticketImageUrl: row.ticket_image_url ?? undefined,
  createdAt: row.created_at
});

export const createExpenseService = async ({
  tripId,
  userId,
  description,
  amount,
  ticketImageUrl
}: CreateExpenseInput): Promise<Expense> => {
  const { data, error } = await supabaseAdmin
    .from('gastos_viaje')
    .insert({
      viaje_id: tripId,
      descripcion: description,
      monto: amount,
      moneda: 'MXN',
      ticket_image_url: ticketImageUrl ?? null,
      creado_por: userId
    })
    .select('id, trip_id:viaje_id, description:descripcion, amount:monto, ticket_image_url, created_at:creado_en')
    .single<ExpenseRow>();

  if (error || !data) {
    throw Object.assign(new Error(normalizeSupabaseErrorMessage(error?.message)), { statusCode: 400 });
  }

  return toExpense(data);
};

export const listExpensesByTripService = async (tripId: string): Promise<Expense[]> => {
  const { data, error } = await supabaseAdmin
    .from('gastos_viaje')
    .select('id, trip_id:viaje_id, description:descripcion, amount:monto, ticket_image_url, created_at:creado_en')
    .eq('viaje_id', tripId)
    .order('creado_en', { ascending: false });

  if (error) {
    throw Object.assign(new Error(normalizeSupabaseErrorMessage(error.message)), { statusCode: 500 });
  }

  return (data ?? []).map((row) => toExpense(row as ExpenseRow));
};
