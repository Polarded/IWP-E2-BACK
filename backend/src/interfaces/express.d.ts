import type { User } from './user.interface.js';

declare global {
  namespace Express {
    interface AuthUser extends User {}
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};