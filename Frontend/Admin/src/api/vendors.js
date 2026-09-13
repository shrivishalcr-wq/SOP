import { apiClient } from './client.js';

export async function listVendors(params) {
  const { data } = await apiClient.get('/api/admin/vendors', { params });
  return data; // { success, data, meta }
}

export async function getVendorDetail(vendorId) {
  const { data } = await apiClient.get(`/api/admin/vendors/${vendorId}`);
  return data.data;
}

export async function updateVendorStatus(vendorId, status) {
  const { data } = await apiClient.patch(`/api/admin/vendors/${vendorId}/status`, { status });
  return data.data;
}
