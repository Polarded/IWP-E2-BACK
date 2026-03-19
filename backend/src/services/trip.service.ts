import { supabaseAdmin } from '../config/db.config.js';
import type { Trip, TripStatus } from '../interfaces/trip.interface.js';
import type { UserRole } from '../interfaces/user.interface.js';
import { notifyManagersOnPendingTrip } from './whatsapp.service.js';

interface CreateTripInput {
  requesterId: string;
  destination: string;
  reason: string;
  startDate: string;
  endDate: string;
}

interface UpdateTripStatusInput {
  tripId: string;
  role: UserRole;
  nextStatus: TripStatus;
  comment?: string;
}

interface ListTripsInput {
  userId: string;
  role: UserRole;
}

interface TripRow {
  id: string;
  requester_id: string;
  destination: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  notes_gestor: string | null;
  notes_finanzas: string | null;
  created_at: string;
  updated_at: string;
}

const normalizeSupabaseErrorMessage = (message?: string): string => {
  const fallback = 'Error en la base de datos';

  if (!message) {
    return fallback;
  }

  if (message.toLowerCase().includes('invalid api key')) {
    return 'Configuracion invalida de Supabase: revisa SUPABASE_SERVICE_ROLE_KEY en backend/.env';
  }

  const lower = message.toLowerCase();
  if (
    lower.includes("could not find the table 'public.viajes' in the schema cache") ||
    lower.includes('relation "viajes" does not exist')
  ) {
    return "La tabla public.viajes no existe en Supabase. Verifica el nombre de tabla real o ejecuta: NOTIFY pgrst, 'reload schema';";
  }

  if (lower.includes('invalid input value for enum estado_viaje')) {
    return 'Valor de estado invalido para enum estado_viaje. Revisa el mapeo de estados en backend/src/services/trip.service.ts.';
  }

  return message;
};

const dbStatusCandidatesByTripStatus: Record<TripStatus, string[]> = {
  PENDING: ['pendiente_gestor', 'PENDIENTE_GESTOR', 'pendiente', 'PENDIENTE', 'pending', 'PENDING'],
  GESTOR_APPROVED: [
    'pendiente_finanzas',
    'PENDIENTE_FINANZAS',
    'aprobado_gestor',
    'APROBADO_GESTOR',
    'gestor_approved',
    'GESTOR_APPROVED'
  ],
  GESTOR_REJECTED: [
    'rechazado',
    'RECHAZADO',
    'rechaza',
    'RECHAZA',
    'rechazado_gestor',
    'RECHAZADO_GESTOR',
    'gestor_rejected',
    'GESTOR_REJECTED'
  ],
  FINANCE_APPROVED: [
    'aprobado',
    'APROBADO',
    'aprobado_finanzas',
    'APROBADO_FINANZAS',
    'finanzas_aprobado',
    'FINANZAS_APROBADO',
    'finance_approved',
    'FINANCE_APPROVED'
  ],
  FINANCE_REJECTED: [
    'rechazado',
    'RECHAZADO',
    'rechaza',
    'RECHAZA',
    'rechazado_finanzas',
    'RECHAZADO_FINANZAS',
    'finanzas_rechazado',
    'FINANZAS_RECHAZADO',
    'finance_rejected',
    'FINANCE_REJECTED'
  ],
  CORRECTION_REQUIRED: [
    'correccion_gestor',
    'CORRECCION_GESTOR',
    'correccion_finanzas',
    'CORRECCION_FINANZAS',
    'correccion_requerida',
    'CORRECCION_REQUERIDA',
    'requiere_correccion',
    'REQUIERE_CORRECCION',
    'correction_required',
    'CORRECTION_REQUIRED'
  ]
};

const tripStatusByDbStatus: Record<string, TripStatus> = {
  pendiente_gestor: 'PENDING',
  pendiente_finanzas: 'GESTOR_APPROVED',
  correccion_gestor: 'CORRECTION_REQUIRED',
  correccion_finanzas: 'CORRECTION_REQUIRED',
  aprobado: 'FINANCE_APPROVED',
  rechazado: 'FINANCE_REJECTED',
  rechaza: 'FINANCE_REJECTED',
  pending: 'PENDING',
  pendiente: 'PENDING',
  gestor_approved: 'GESTOR_APPROVED',
  aprobado_gestor: 'GESTOR_APPROVED',
  gestor_rejected: 'GESTOR_REJECTED',
  rechazado_gestor: 'GESTOR_REJECTED',
  finance_approved: 'FINANCE_APPROVED',
  aprobado_finanzas: 'FINANCE_APPROVED',
  finance_rejected: 'FINANCE_REJECTED',
  rechazado_finanzas: 'FINANCE_REJECTED',
  correction_required: 'CORRECTION_REQUIRED',
  correccion_requerida: 'CORRECTION_REQUIRED'
};

const toAppTripStatus = (dbStatus: string): TripStatus => {
  const mapped = tripStatusByDbStatus[dbStatus.toLowerCase()];
  return mapped ?? 'PENDING';
};

const roleAllowedStatus: Record<UserRole, TripStatus[]> = {
  USER: ['CORRECTION_REQUIRED'],
  GESTOR: ['GESTOR_APPROVED', 'GESTOR_REJECTED', 'CORRECTION_REQUIRED'],
  FINANZAS: ['FINANCE_APPROVED', 'FINANCE_REJECTED', 'CORRECTION_REQUIRED']
};

const toTrip = (row: TripRow): Trip => ({
  id: row.id,
  requesterId: row.requester_id,
  destination: row.destination,
  reason: row.reason,
  startDate: row.start_date,
  endDate: row.end_date,
  status: toAppTripStatus(row.status),
  comment: row.notes_finanzas ?? row.notes_gestor ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const createTripService = async (input: CreateTripInput): Promise<Trip> => {
  let lastEnumErrorMessage: string | undefined;

  for (const statusCandidate of dbStatusCandidatesByTripStatus.PENDING) {
    const { data, error } = await supabaseAdmin
      .from('viajes')
      .insert({
        usuario_id: input.requesterId,
        destino: input.destination,
        motivo: input.reason,
        fecha_inicio: input.startDate,
        fecha_fin: input.endDate,
        estado: statusCandidate
      })
      .select(
        'id, requester_id:usuario_id, destination:destino, reason:motivo, start_date:fecha_inicio, end_date:fecha_fin, status:estado, notes_gestor:notas_gestor, notes_finanzas:notas_finanzas, created_at:creado_en, updated_at:actualizado_en'
      )
      .single<TripRow>();

    if (!error && data) {
      const createdTrip = toTrip(data);

      try {
        await notifyManagersOnPendingTrip({
          tripId: createdTrip.id,
          requesterId: createdTrip.requesterId,
          destination: createdTrip.destination,
          startDate: createdTrip.startDate,
          endDate: createdTrip.endDate,
          reason: createdTrip.reason
        });
      } catch (notificationError) {
        console.warn('[twilio] Failed to notify managers on pending trip:', notificationError);
      }

      return createdTrip;
    }

    const errorMessage = error?.message?.toLowerCase() ?? '';
    if (!errorMessage.includes('invalid input value for enum estado_viaje')) {
      throw Object.assign(new Error(normalizeSupabaseErrorMessage(error?.message ?? 'No se pudo crear el viaje')), {
        statusCode: 400
      });
    }

    lastEnumErrorMessage = error?.message;
  }

  throw Object.assign(new Error(normalizeSupabaseErrorMessage(lastEnumErrorMessage ?? 'No se pudo crear el viaje')), {
    statusCode: 400
  });
};

export const listTripsService = async ({ userId, role }: ListTripsInput): Promise<Trip[]> => {
  let query = supabaseAdmin
    .from('viajes')
    .select(
      'id, requester_id:usuario_id, destination:destino, reason:motivo, start_date:fecha_inicio, end_date:fecha_fin, status:estado, notes_gestor:notas_gestor, notes_finanzas:notas_finanzas, created_at:creado_en, updated_at:actualizado_en'
    )
    .order('creado_en', { ascending: false });

  if (role === 'USER') {
    query = query.eq('usuario_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw Object.assign(new Error(normalizeSupabaseErrorMessage(error.message)), { statusCode: 500 });
  }

  return (data ?? []).map((row) => toTrip(row as TripRow));
};

export const updateTripStatusService = async ({ tripId, role, nextStatus, comment }: UpdateTripStatusInput): Promise<Trip> => {
  const { data: current, error: currentError } = await supabaseAdmin
    .from('viajes')
    .select(
      'id, requester_id:usuario_id, destination:destino, reason:motivo, start_date:fecha_inicio, end_date:fecha_fin, status:estado, notes_gestor:notas_gestor, notes_finanzas:notas_finanzas, created_at:creado_en, updated_at:actualizado_en'
    )
    .eq('id', tripId)
    .maybeSingle<TripRow>();

  if (currentError || !current) {
    throw Object.assign(new Error('Viaje no encontrado'), { statusCode: 404 });
  }

  if (!roleAllowedStatus[role].includes(nextStatus)) {
    throw Object.assign(new Error('Estado no permitido para este rol'), { statusCode: 403 });
  }

  const statusCandidates =
    nextStatus === 'CORRECTION_REQUIRED'
      ? role === 'GESTOR'
        ? ['correccion_gestor', 'CORRECCION_GESTOR', ...dbStatusCandidatesByTripStatus[nextStatus]]
        : role === 'FINANZAS'
          ? ['correccion_finanzas', 'CORRECCION_FINANZAS', ...dbStatusCandidatesByTripStatus[nextStatus]]
          : dbStatusCandidatesByTripStatus[nextStatus]
      : dbStatusCandidatesByTripStatus[nextStatus];

  let lastEnumErrorMessage: string | undefined;

  for (const statusCandidate of statusCandidates) {
    const updatePayload: {
      estado: string;
      actualizado_en: string;
      notas_gestor?: string | null;
      notas_finanzas?: string | null;
    } = {
      estado: statusCandidate,
      actualizado_en: new Date().toISOString()
    };

    if (role === 'GESTOR') {
      updatePayload.notas_gestor = comment ?? null;
    }

    if (role === 'FINANZAS') {
      updatePayload.notas_finanzas = comment ?? null;
    }

    const { data, error } = await supabaseAdmin
      .from('viajes')
      .update(updatePayload)
      .eq('id', tripId)
      .select(
        'id, requester_id:usuario_id, destination:destino, reason:motivo, start_date:fecha_inicio, end_date:fecha_fin, status:estado, notes_gestor:notas_gestor, notes_finanzas:notas_finanzas, created_at:creado_en, updated_at:actualizado_en'
      )
      .single<TripRow>();

    if (!error && data) {
      return toTrip(data);
    }

    const errorMessage = error?.message?.toLowerCase() ?? '';
    if (!errorMessage.includes('invalid input value for enum estado_viaje')) {
      throw Object.assign(new Error(normalizeSupabaseErrorMessage(error?.message ?? 'No se pudo actualizar el viaje')), {
        statusCode: 400
      });
    }

    lastEnumErrorMessage = error?.message;
  }

  throw Object.assign(new Error(normalizeSupabaseErrorMessage(lastEnumErrorMessage ?? 'No se pudo actualizar el viaje')), {
    statusCode: 400
  });
};
