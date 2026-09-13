import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { RatingStars } from '../../components/RatingStars.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { PrimaryButton } from '../../components/PrimaryButton.js';
import { submitRating } from '../../api/ratings.js';
import { colors } from '../../theme/colors.js';

export function VendorDetailScreen({ route, navigation }) {
  const { vendor } = route.params;

  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (ratingValue < 1) {
      setError('Tap a star to choose a rating');
      return;
    }

    setSubmitting(true);
    try {
      await submitRating(vendor.Vendor_ID, ratingValue, review.trim());
      setSubmitted(true);
    } catch (err) {
      // A 403 here specifically means the anti-fraud proximity gate
      // rejected the rating - this vendor hasn't actually alerted this
      // resident recently, so surface that plainly rather than a generic error.
      setError(err?.response?.data?.message || 'Could not submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{vendor.VendorName}</Text>
      <Text style={styles.meta}>{vendor.Vehicle}</Text>

      <View style={styles.row}>
        <StatusBadge status={vendor.status} />
        {typeof vendor.AvgRating === 'number' && (
          <Text style={styles.avgRating}>{'\u2605'} {vendor.AvgRating.toFixed(1)} average</Text>
        )}
      </View>

      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{vendor.distanceKm?.toFixed(2)} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>~{vendor.etaMinutes ?? 'N/A'} min</Text>
          <Text style={styles.statLabel}>ETA</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {submitted ? (
        <View style={styles.thankYou}>
          <Text style={styles.thankYouText}>Thanks for rating {vendor.VendorName}!</Text>
          <PrimaryButton title="Back to map" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Rate this vendor</Text>
          <Text style={styles.sectionHint}>
            You can only rate a vendor after they've actually passed near you.
          </Text>

          <RatingStars value={ratingValue} onChange={setRatingValue} size={36} />

          <TextInput
            style={styles.reviewInput}
            value={review}
            onChangeText={setReview}
            placeholder="Add a short review (optional)"
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Submit rating" onPress={handleSubmit} loading={submitting} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 32, backgroundColor: colors.bg, flexGrow: 1 },
  name: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  avgRating: { color: colors.warning, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionHint: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  reviewInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    marginTop: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  thankYou: { alignItems: 'center', gap: 16, paddingTop: 12 },
  thankYouText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});
