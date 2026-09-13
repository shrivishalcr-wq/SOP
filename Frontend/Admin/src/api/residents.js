import { apiClient } from './client.js';

export async function listResidents(params) {
  const { data } = await apiClient.get('/api/admin/residents', { params });
  return data;
}

export async function getResidentDetail(residentId) {
  const { data } = await apiClient.get(`/api/admin/residents/${residentId}`);
  return data.data;
}
