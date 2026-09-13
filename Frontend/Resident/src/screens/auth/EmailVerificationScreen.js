import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../context/AuthContext.js';
import { PrimaryButton } from '../../components/PrimaryButton.js';
import { colors } from '../../theme/colors.js';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Shown when status === 'needsEmailVerification' (see RootNavigator).
 * Firebase's own emailVerified flag only updates after reload(), so this
 * screen polls that manually via the "I've verified" button rather than
 * relying on any push/webhook - there's no server-side event for "user
 * clicked the link" that this app can subscribe to.
 */
export function EmailVerificationScreen() {
  const { firebaseUser, resendVerificationEmail, refreshVerificationStatus, signOut } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  async function handleCheckVerified() {
    setError(null);
    setInfo(null);
    setChecking(true);
    try {
      const verified = await refreshVerificationStatus();
      if (!verified) {
        setError("Still not verified - check your inbox (and spam folder) for the link, then try again.");
      }
      // If verified, AuthContext's status flips to needsSync/ready and
      // RootNavigator swaps screens automatically - nothing else to do.
    } catch (err) {
      setError(err.message || 'Could not check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await resendVerificationEmail();
      setInfo('Verification email sent again.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Could not resend the email. Please try again shortly.');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        We sent a verification link to{' '}
        <Text style={styles.email}>{firebaseUser?.email}</Text>. Open it, then come back here.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <PrimaryButton title="I've verified, continue" onPress={handleCheckVerified} loading={checking} />

      <Pressable
        onPress={handleResend}
        disabled={resending || cooldown > 0}
        style={styles.resendLink}
      >
        <Text style={[styles.linkText, (resending || cooldown > 0) && styles.linkTextDisabled]}>
          {cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend email'}
        </Text>
      </Pressable>

      <Pressable onPress={signOut} style={styles.signOutLink}>
        <Text style={styles.linkTextMuted}>Use a different account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 96, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  email: { fontWeight: '700', color: colors.textPrimary },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  info: { color: colors.success, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  resendLink: { marginTop: 20 },
  signOutLink: { marginTop: 16 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  linkTextDisabled: { color: colors.stale },
  linkTextMuted: { color: colors.textSecondary, fontSize: 13 },
});