import { supabase } from '../config/db.config.js';
import { hashPassword, verifyPassword } from '../utils/hash.util.js';
import { signToken } from '../utils/jwt.util.js';
import type { UserRole } from '../interfaces/user.interface.js';

interface RegisterInput {
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerService = async ({ email, password, role = 'USER' }: RegisterInput) => {
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash, role })
    .select('id, email, role')
    .single();

  if (error) {
    throw Object.assign(new Error(error.message), { statusCode: 400 });
  }

  const token = signToken({ sub: data.id, email: data.email, role: data.role as UserRole });
  return { user: data, token };
};

export const loginService = async ({ email, password }: LoginInput) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const valid = await verifyPassword(password, data.password_hash as string);

  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const token = signToken({ sub: data.id as string, email: data.email as string, role: data.role as UserRole });
  return {
    user: {
      id: data.id,
      email: data.email,
      role: data.role
    },
    token
  };
};
