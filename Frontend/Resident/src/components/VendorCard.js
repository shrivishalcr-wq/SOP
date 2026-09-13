import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';
import { StatusBadge } from './StatusBadge.js';

export function VendorCard({ vendor, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {vendor.VendorName}
        </Text>
        <Text style={styles.meta}>
          {vendor.Vehicle} · {vendor.distanceKm?.toFixed(2)} km · ~{vendor.etaMinutes} min
        </Text>
        <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={vendor.status} />
          {typeof vendor.AvgRating === 'number' && (
            <Text style={styles.rating}>{'\u2605'} {vendor.AvgRating.toFixed(1)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rating: { fontSize: 13, fontWeight: '600', color: colors.warning },
});
