import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../interfaces/user.interface.js';

export const roleMiddleware = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(Object.assign(new Error('No autenticado'), { statusCode: 401 }));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(Object.assign(new Error('No autorizado para esta acción'), { statusCode: 403 }));
      return;
    }

    next();
  };
};
