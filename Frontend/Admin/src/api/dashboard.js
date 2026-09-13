import { apiClient } from './client.js';

export async function getDashboardSummary() {
  const { data } = await apiClient.get('/api/admin/dashboard');
  return data.data;
}

export async function getPilotReport(windowDays) {
  const { data } = await apiClient.get('/api/admin/pilot-report', {
    params: windowDays ? { windowDays } : undefined,
  });
  return data.data;
}
