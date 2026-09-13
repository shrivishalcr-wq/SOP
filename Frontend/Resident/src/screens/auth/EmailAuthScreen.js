import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useAuth } from '../../context/AuthContext.js';
import { PrimaryButton } from '../../components/PrimaryButton.js';
import { colors } from '../../theme/colors.js';

/**
 * The app's only sign-in screen (email/password auth). Replaces the old
 * phone-OTP flow (PhoneLoginScreen + OtpVerifyScreen) - Firebase Phone
 * Auth bills per SMS verification, email/password has no such per-user
 * cost, and needs no reCAPTCHA/WebView modal, so unlike the old phone
 * screens this one file works identically on web and native - no
 * `.native.js` split required.
 */
export function EmailAuthScreen() {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState('signIn'); // 'signIn' | 'signUp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const isSignUp = mode === 'signUp';

  function validate() {
    const trimmedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Enter a valid email address';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (isSignUp && password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  async function handleSubmit() {
    setError(null);
    setInfo(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      // onAuthStateChanged in AuthContext drives navigation from here.
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter your email address above first, then tap "Forgot password?"');
      return;
    }

    try {
      await resetPassword(trimmedEmail);
      setInfo('Password reset email sent - check your inbox.');
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.hero}>
        <Text style={styles.appName}>VendiConnect</Text>
        <Text style={styles.appTagline}>
          Find the street vendor cart before it passes your street.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Sign up with your email to get started.' : 'Sign in with your email and password.'}
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'password-new' : 'password'}
          placeholder="Password (min. 8 characters)"
        />

        {isSignUp && (
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Confirm password"
          />
        )}

        {!isSignUp && (
          <Pressable onPress={handleForgotPassword} style={styles.forgotLink}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <PrimaryButton
          title={isSignUp ? 'Create account' : 'Sign in'}
          onPress={handleSubmit}
          loading={submitting}
        />

        <Pressable
          onPress={() => {
            setMode(isSignUp ? 'signIn' : 'signUp');
            setError(null);
            setInfo(null);
          }}
          style={styles.switchModeLink}
        >
          <Text style={styles.linkText}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Firebase Auth error codes are stable across the JS SDK - map the common
 * ones to copy a resident will actually understand.
 */
function friendlyAuthError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password is too weak - use at least 8 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return err?.message || 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 80, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  appTagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  form: { flex: 1, justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, marginTop: 4 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 8 },
  switchModeLink: { alignSelf: 'center', marginTop: 16 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  info: { color: colors.success, fontSize: 13, marginBottom: 8 },
});
