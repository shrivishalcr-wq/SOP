import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';

export function LoadingOverlay({ label }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
});
