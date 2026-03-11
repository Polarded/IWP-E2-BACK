import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.util.js';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw Object.assign(new Error('Token no proporcionado'), { statusCode: 401 });
    }

    const token = header.replace('Bearer ', '').trim();
    const payload = verifyToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    next(Object.assign(new Error('Token inválido'), { statusCode: 401 }));
  }
};
