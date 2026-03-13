import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt.util.js';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      next(Object.assign(new Error('Token no proporcionado'), { statusCode: 401 }));
      return;
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
    if (error instanceof jwt.TokenExpiredError) {
      next(Object.assign(new Error('Token expirado'), { statusCode: 401 }));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(Object.assign(new Error('Token inválido'), { statusCode: 401 }));
      return;
    }

    next(Object.assign(new Error('No autenticado'), { statusCode: 401 }));
  }
};
