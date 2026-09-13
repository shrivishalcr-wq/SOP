import axios from 'axios';
import { auth } from '../config/firebase.js';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
});

// Every request gets a fresh ID token - Firebase's SDK caches/refreshes
// the underlying JWT internally, so calling getIdToken() repeatedly is
// cheap and always returns a non-expired token.
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback;
}
