import { apiClient } from './client.js';

/**
 * The backend derives residentId from the Firebase-verified token, not
 * from this payload - see ratingController.js. A 403 here means the
 * vendor never actually passed within alert range of this resident
 * recently (proximity-gated anti-fraud check).
 */
export async function submitRating(vendorId, ratingValue, review) {
  const { data } = await apiClient.post('/api/ratings', { vendorId, ratingValue, review });
  return data.data;
}
