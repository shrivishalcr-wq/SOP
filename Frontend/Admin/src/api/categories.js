import { apiClient } from './client.js';

export async function listCategories() {
  const { data } = await apiClient.get('/api/admin/categories');
  return data.data;
}

export async function createCategory(payload) {
  const { data } = await apiClient.post('/api/admin/categories', payload);
  return data.data;
}

export async function updateCategory(categoryId, payload) {
  const { data } = await apiClient.patch(`/api/admin/categories/${categoryId}`, payload);
  return data.data;
}

export async function deleteCategory(categoryId) {
  const { data } = await apiClient.delete(`/api/admin/categories/${categoryId}`);
  return data;
}
