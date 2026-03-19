import { supabaseAdmin } from '../config/db.config.js';
import type { Trip, TripStatus } from '../interfaces/trip.interface.js';
import type { UserRole } from '../interfaces/user.interface.js';
import { sendWhatsApp } from './whatsapp.service.js';

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

  return message;
};

const dbStatusCandidatesByTripStatus: Record<TripStatus, string[]> = {
  PENDING: ['pendiente_gestor'],
  GESTOR_APPROVED: ['pendiente_finanzas'],
  GESTOR_REJECTED: ['rechazado_gestor'],
  FINANCE_APPROVED: ['aprobado'],
  FINANCE_REJECTED: ['rechazado'],
  CORRECTION_REQUIRED: ['correccion_gestor']
};

const tripStatusByDbStatus: Record<string, TripStatus> = {
  pendiente_gestor: 'PENDING',
  pendiente_finanzas: 'GESTOR_APPROVED',
  aprobado: 'FINANCE_APPROVED',
  rechazado: 'FINANCE_REJECTED',
  correccion_gestor: 'CORRECTION_REQUIRED'
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

  const { data, error } = await supabaseAdmin
    .from('viajes')
    .insert({
      usuario_id: input.requesterId,
      destino: input.destination,
      motivo: input.reason,
      fecha_inicio: input.startDate,
      fecha_fin: input.endDate,
      estado: 'pendiente_gestor'
    })
    .select(
      'id, requester_id:usuario_id, destination:destino, reason:motivo, start_date:fecha_inicio, end_date:fecha_fin, status:estado, notes_gestor:notas_gestor, notes_finanzas:notas_finanzas, created_at:creado_en, updated_at:actualizado_en'
    )
    .single<TripRow>();

  if (error || !data) {
    throw Object.assign(new Error(normalizeSupabaseErrorMessage(error?.message)), {
      statusCode: 400
    });
  }

  const trip = toTrip(data);

  try {

    const { data: gestor } = await supabaseAdmin
      .from('usuarios')
      .select('telefono')
      .eq('rol', 'GESTOR')
      .maybeSingle();

    if (gestor?.telefono) {

      await sendWhatsApp(
        `whatsapp:${gestor.telefono}`,
        `Nuevo viaje solicitado

Usuario: ${input.requesterId}
Destino: ${trip.destination}
Motivo: ${trip.reason}
Salida: ${trip.startDate}
Regreso: ${trip.endDate}`
      );

    }

  } catch (err) {
    console.error('Error enviando WhatsApp:', err);
  }

  return trip;
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
    throw Object.assign(new Error(normalizeSupabaseErrorMessage(error.message)), {
      statusCode: 500
    });
  }

  return (data ?? []).map((row) => toTrip(row as TripRow));
};

export const updateTripStatusService = async ({
  tripId,
  role,
  nextStatus,
  comment
}: UpdateTripStatusInput): Promise<Trip> => {

  const { data: current } = await supabaseAdmin
    .from('viajes')
    .select(
      'id, requester_id:usuario_id, destination:destino, reason:motivo, start_date:fecha_inicio, end_date:fecha_fin, status:estado, notes_gestor:notas_gestor, notes_finanzas:notas_finanzas, created_at:creado_en, updated_at:actualizado_en'
    )
    .eq('id', tripId)
    .maybeSingle<TripRow>();

  if (!current) {
    throw Object.assign(new Error('Viaje no encontrado'), { statusCode: 404 });
  }

  if (!roleAllowedStatus[role].includes(nextStatus)) {
    throw Object.assign(new Error('Estado no permitido para este rol'), {
      statusCode: 403
    });
  }

  const statusCandidate = dbStatusCandidatesByTripStatus[nextStatus][0];

  const updatePayload: any = {
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

  if (error || !data) {
    throw Object.assign(new Error('No se pudo actualizar el viaje'), {
      statusCode: 400
    });
  }

  return toTrip(data);
};