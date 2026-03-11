import type { User } from './user.interface.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
