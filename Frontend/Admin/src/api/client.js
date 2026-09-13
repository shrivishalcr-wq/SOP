/**
 * api/client.js
 * -----------------------------------------------------------------------
 * Single axios instance for every API call in the app.
 *
 *   - Attaches the admin JWT (if present) to every request.
 *   - Logs every failed request with method/URL/status for debugging.
 *   - On a 401, clears the stored session and redirects to /login rather
 *     than leaving the app in a half-authenticated state.
 * -----------------------------------------------------------------------
 */

import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('api');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'vendiconnect_admin_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    logger.warn('localStorage unavailable while reading token', err);
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    logger.warn('localStorage unavailable while writing token', err);
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set by AuthContext once mounted, so a 401 can trigger a clean logout
// without this module needing to import React context machinery.
let onUnauthorized = null;
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    const method = config?.method?.toUpperCase() || 'UNKNOWN';
    const url = config?.url || 'unknown-url';
    const status = response?.status ?? 'network-error';
    const message = response?.data?.message || error.message;

    logger.error(`${method} ${url} failed (${status}): ${message}`);

    if (response?.status === 401 && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

/**
 * Normalizes any axios/API error into a plain string suitable for
 * displaying in the UI, while the full error is already logged above.
 */
export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback;
}
