/**
 * @file corsConfig.js
 * @description CORS configuration middleware.
 * Configures cross-origin resource sharing with environment-based origin whitelisting.
 * @module middleware/corsConfig
 */

import cors from 'cors';

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8081',
];

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_DEV_ORIGINS;

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

function isOriginAllowed(origin) {
  return allowedOrigins.includes(origin);
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.warn(`[cors] Blocked request from disallowed origin: ${origin}`);
    return callback(new Error('Not allowed by CORS policy'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
});
