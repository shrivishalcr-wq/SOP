import { apiClient } from './client.js';

export async function login(email, password) {
  const { data } = await apiClient.post('/api/admin/login', { email, password });
  return data.data; // { token, expiresIn, admin: { email, role } }
}

export async function register(email, password, role) {
  const { data } = await apiClient.post('/api/admin/register', { email, password, role });
  return data.data;
}

export async function getMe() {
  const { data } = await apiClient.get('/api/admin/me');
  return data.data;
}
