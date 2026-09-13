import { apiClient } from './client.js';

export async function listCategories() {
  const { data } = await apiClient.get('/api/categories');
  return data.data;
}

export async function getMyPreferences(residentId) {
  const { data } = await apiClient.get(`/api/residents/${residentId}/preferences`);
  return data.data;
}

export async function setMyPreferences(residentId, categoryIds) {
  const { data } = await apiClient.put(`/api/residents/${residentId}/preferences`, { categoryIds });
  return data.data;
}
