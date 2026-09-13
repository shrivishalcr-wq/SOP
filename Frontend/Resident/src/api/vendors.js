import { apiClient } from './client.js';

export async function getNearbyVendors({ lat, lng, radius, category, minRating }) {
  const { data } = await apiClient.get('/api/vendors/nearby', {
    params: { lat, lng, radius, category, minRating },
  });
  return data;
}

export async function getVendorAnalytics(vendorId) {
  const { data } = await apiClient.get(`/api/vendors/${vendorId}/analytics`);
  return data.data;
}
