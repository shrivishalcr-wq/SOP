import { apiClient } from './client.js';

export async function listActivity(params) {
  const { data } = await apiClient.get('/api/admin/activity', { params });
  return data;
}
