import type { NextFunction, Request, Response } from 'express';
import { loginService, registerService } from '../services/auth.service.js';

export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role?: 'USER' | 'GESTOR' | 'FINANZAS';
    };

    const result = await registerService({ email, password, role });
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const result = await loginService({ email, password });
    res.status(200).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
};
