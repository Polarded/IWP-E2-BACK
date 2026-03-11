import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import type { UserRole } from '../interfaces/user.interface.js';

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};