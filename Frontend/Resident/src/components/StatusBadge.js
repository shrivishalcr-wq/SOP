import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';

const STATUS_STYLE = {
  ACTIVE: { bg: '#dcfce7', fg: colors.success, label: 'Active' },
  APPROACHING: { bg: '#fef3c7', fg: colors.warning, label: 'Approaching' },
  STALE_SIGNAL: { bg: '#f1f5f9', fg: colors.stale, label: 'Signal lost' },
  OFFLINE: { bg: '#fee2e2', fg: colors.danger, label: 'Offline' },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.OFFLINE;

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <View style={[styles.dot, { backgroundColor: style.fg }]} />
      <Text style={[styles.label, { color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  label: { fontSize: 12, fontWeight: '600' },
});
