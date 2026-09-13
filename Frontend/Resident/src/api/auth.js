import { apiClient } from './client.js';

export async function syncResident({ displayName, address, homeLatitude, homeLongitude } = {}) {
  const { data } = await apiClient.post('/api/residents/auth/sync', {
    displayName,
    address,
    homeLatitude,
    homeLongitude,
  });
  return data.data;
}

export async function getMyProfile() {
  const { data } = await apiClient.get('/api/residents/auth/me');
  return data.data;
}

export async function updateMyProfile(updates) {
  const { data } = await apiClient.patch('/api/residents/auth/me', updates);
  return data.data;
}

export async function updateFcmToken(fcmToken) {
  const { data } = await apiClient.patch('/api/residents/auth/fcm-token', { fcmToken });
  return data;
}
