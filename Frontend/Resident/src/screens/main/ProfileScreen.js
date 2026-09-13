import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext.js';
import { listCategories } from '../../api/preferences.js';
import { getMyPreferences, setMyPreferences } from '../../api/preferences.js';
import { updateMyProfile } from '../../api/auth.js';
import { CategoryChip } from '../../components/CategoryChip.js';
import { PrimaryButton } from '../../components/PrimaryButton.js';
import { LoadingOverlay } from '../../components/LoadingOverlay.js';
import { colors } from '../../theme/colors.js';

const RADIUS_OPTIONS = [250, 500, 1000, 2000];

export function ProfileScreen() {
  const { resident, refreshProfile, signOut } = useAuth();

  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [radius, setRadius] = useState(resident?.NotificationRadius || 500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!resident?.Resident_ID) return;
    
    setLoading(true);
    try {
      const [allCategories, myPreferences] = await Promise.all([
        listCategories(),
        getMyPreferences(resident.Resident_ID),
      ]);
      setCategories(allCategories);
      setSelectedIds(new Set(myPreferences.map((c) => c._id)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }, [resident]);

  useEffect(() => {
    if (resident?.Resident_ID) loadData();
  }, [resident, loadData]);

  function toggleCategory(categoryId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await setMyPreferences(resident.Resident_ID, Array.from(selectedIds));
      await updateMyProfile({ NotificationRadius: radius });
      await refreshProfile();
      Alert.alert('Saved', 'Your preferences have been updated.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (loading) return <LoadingOverlay label="Loading your profile…" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{resident?.DisplayName}</Text>
      <Text style={styles.meta}>{resident?.Address || 'No address set'}</Text>

      <Text style={styles.sectionTitle}>Favorite categories</Text>
      <View style={styles.chipWrap}>
        {categories.map((category) => (
          <CategoryChip
            key={category._id}
            label={category.Name}
            selected={selectedIds.has(category._id)}
            onPress={() => toggleCategory(category._id)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Alert me when a vendor is within</Text>
      <View style={styles.chipWrap}>
        {RADIUS_OPTIONS.map((option) => (
          <CategoryChip
            key={option}
            label={option >= 1000 ? `${option / 1000} km` : `${option} m`}
            selected={radius === option}
            onPress={() => setRadius(option)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Save changes" onPress={handleSave} loading={saving} />

      <View style={{ height: 24 }} />

      <PrimaryButton title="Sign out" variant="outline" onPress={handleSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 48, backgroundColor: colors.bg, flexGrow: 1 },
  name: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
});
