import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext.js';
import { useResidentLocation } from '../../context/LocationContext.js';
import { updateMyProfile } from '../../api/auth.js';
import { extractErrorMessage } from '../../api/client.js';
import { PrimaryButton } from '../../components/PrimaryButton.js';
import { colors } from '../../theme/colors.js';

/**
 * Shown in two situations (see RootNavigator):
 *   1. resident === null (first-ever sign-in) - collect a display name,
 *      then create the backend Resident record via completeSync().
 *   2. resident exists but has no home location yet - just grab location
 *      and patch the existing profile.
 * Either way, the goal is the same: end up with a resident that has a
 * home location on file so nearby-vendor matching can work.
 */
export function OnboardingScreen() {
  const { resident, completeSync, refreshProfile } = useAuth();
  const { requestAndFetch, error: locationError } = useResidentLocation();

  const isFirstSync = !resident;

  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleContinue() {
    setError(null);
    setSubmitting(true);

    try {
      const coords = await requestAndFetch();

      if (!coords) {
        setError(locationError || 'Location permission is needed to find vendors near you.');
        setSubmitting(false);
        return;
      }

      if (isFirstSync) {
        await completeSync({
          displayName: displayName.trim() || 'Resident',
          address: address.trim(),
          homeLatitude: coords.latitude,
          homeLongitude: coords.longitude,
        });
      } else {
        await updateMyProfile({ homeLatitude: coords.latitude, homeLongitude: coords.longitude });
        await refreshProfile();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isFirstSync ? "Let's set up your account" : 'One more thing'}</Text>
      <Text style={styles.subtitle}>
        {isFirstSync
          ? "We'll use your home location to alert you when a vendor is nearby."
          : 'Share your location so we can find vendors near you.'}
      </Text>

      {isFirstSync && (
        <>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Street / area (optional)"
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Share my location & continue" onPress={handleContinue} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 96 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
});
