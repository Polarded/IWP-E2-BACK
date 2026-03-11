import type { NextFunction, Request, Response } from 'express';

interface AppError {
  message: string;
  statusCode?: number;
}

export const errorMiddleware = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(error.statusCode ?? 500).json({
    ok: false,
    message: error.message ?? 'Error interno del servidor'
  });
};
