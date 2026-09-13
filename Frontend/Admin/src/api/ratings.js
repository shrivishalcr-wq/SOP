import { apiClient } from './client.js';

export async function listRatings(params) {
  const { data } = await apiClient.get('/api/admin/ratings', { params });
  return data;
}
