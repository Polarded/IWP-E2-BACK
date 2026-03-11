import { randomUUID } from 'node:crypto';
import type { Trip, TripStatus } from '../interfaces/trip.interface.js';
import type { UserRole } from '../interfaces/user.interface.js';

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

const trips = new Map<string, Trip>();

const roleAllowedStatus: Record<UserRole, TripStatus[]> = {
  USER: ['CORRECTION_REQUIRED'],
  GESTOR: ['GESTOR_APPROVED', 'GESTOR_REJECTED', 'CORRECTION_REQUIRED'],
  FINANZAS: ['FINANCE_APPROVED', 'FINANCE_REJECTED', 'CORRECTION_REQUIRED']
};

export const createTripService = (input: CreateTripInput): Trip => {
  const now = new Date().toISOString();
  const trip: Trip = {
    id: randomUUID(),
    requesterId: input.requesterId,
    destination: input.destination,
    reason: input.reason,
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now
  };

  trips.set(trip.id, trip);
  return trip;
};

export const listTripsService = (): Trip[] => Array.from(trips.values());

export const updateTripStatusService = ({ tripId, role, nextStatus, comment }: UpdateTripStatusInput): Trip => {
  const trip = trips.get(tripId);

  if (!trip) {
    throw Object.assign(new Error('Viaje no encontrado'), { statusCode: 404 });
  }

  if (!roleAllowedStatus[role].includes(nextStatus)) {
    throw Object.assign(new Error('Estado no permitido para este rol'), { statusCode: 403 });
  }

  const updated: Trip = {
    ...trip,
    status: nextStatus,
    comment,
    updatedAt: new Date().toISOString()
  };

  trips.set(tripId, updated);
  return updated;
};
