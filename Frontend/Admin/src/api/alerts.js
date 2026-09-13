import { apiClient } from './client.js';

export async function listAlerts(params) {
  const { data } = await apiClient.get('/api/admin/alerts', { params });
  return data;
}
