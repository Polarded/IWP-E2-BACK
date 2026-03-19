import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  SERPAPI_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(),
  GESTOR_WHATSAPP_TO: z.string().min(1).optional(),
  ENABLE_GESTOR_WHATSAPP_NOTIFICATIONS: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true')
});

export const env = envSchema.parse(process.env);
