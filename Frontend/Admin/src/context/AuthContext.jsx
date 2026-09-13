import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredToken, setStoredToken, registerUnauthorizedHandler } from '../api/client.js';
import { login as loginRequest, getMe } from '../api/auth.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth');

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null); // { email, role }
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

  const logout = useCallback(() => {
    setStoredToken(null);
    setAdmin(null);
    setStatus('unauthenticated');
    logger.info('Session cleared');
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logger.warn('Received 401 from API - clearing session');
      logout();
    });
  }, [logout]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    getMe()
      .then((profile) => {
        setAdmin(profile);
        setStatus('authenticated');
      })
      .catch((err) => {
        logger.warn('Stored token rejected on rehydration', err);
        setStoredToken(null);
        setStatus('unauthenticated');
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginRequest(email, password);
    setStoredToken(result.token);
    setAdmin(result.admin);
    setStatus('authenticated');
    logger.info(`Logged in as ${result.admin.email} (${result.admin.role})`);
    return result.admin;
  }, []);

  const value = useMemo(
    () => ({ admin, status, isAuthenticated: status === 'authenticated', login, logout }),
    [admin, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
