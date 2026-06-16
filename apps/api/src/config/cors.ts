import type { CorsOptions } from 'cors';
import { env } from './env.js';

const allowedOrigins = new Set([
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

export function isAllowedOrigin(origin?: string) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  }
};
