export type TripStatus =
  | 'PENDING'
  | 'GESTOR_APPROVED'
  | 'GESTOR_REJECTED'
  | 'FINANCE_APPROVED'
  | 'FINANCE_REJECTED'
  | 'CORRECTION_REQUIRED';

export interface Trip {
  id: string;
  requesterId: string;
  destination: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
