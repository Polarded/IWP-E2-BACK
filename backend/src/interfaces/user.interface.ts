export type UserRole = 'USER' | 'GESTOR' | 'FINANZAS';

export interface User {
  id: string;
  email: string;
  role: UserRole;

  telefono?: string;
}
