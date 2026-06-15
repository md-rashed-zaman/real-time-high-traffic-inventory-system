import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  RESERVATION_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  EXPIRATION_WORKER_INTERVAL_MS: z.coerce.number().int().positive().default(5000)
});

export const env = envSchema.parse(process.env);
