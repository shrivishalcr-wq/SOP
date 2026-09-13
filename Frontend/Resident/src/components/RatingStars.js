import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';

export function RatingStars({ value, onChange, size = 28, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => (
        <Pressable key={star} disabled={readOnly} onPress={() => onChange && onChange(star)} hitSlop={6}>
          <Text style={[styles.star, { fontSize: size, color: star <= value ? colors.warning : colors.border }]}>
            {'\u2605'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  star: { marginRight: 6 },
});
