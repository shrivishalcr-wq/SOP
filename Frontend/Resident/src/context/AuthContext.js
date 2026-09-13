import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { syncResident, getMyProfile } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [resident, setResident] = useState(null);
  // 'loading' | 'signedOut' | 'needsEmailVerification' | 'needsSync' | 'ready'
  const [status, setStatus] = useState('loading');

  const loadResidentState = useCallback(async (user) => {
    // Backend rejects /auth/sync and /auth/me for an unverified email
    // (403), so don't even call it yet - just park on the verification
    // screen until Firebase confirms the address is real.
    if (!user.emailVerified) {
      setResident(null);
      setStatus('needsEmailVerification');
      return;
    }

    try {
      const profile = await getMyProfile();
      setResident(profile);
      setStatus('ready');
    } catch {
      // No resident doc yet for this Firebase account - first-ever
      // sign-in, needs the sync step (collects display name etc).
      setStatus('needsSync');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setResident(null);
        setStatus('signedOut');
        return;
      }

      await loadResidentState(user);
    });

    return unsubscribe;
  }, [loadResidentState]);

  /**
   * Call once right after the resident's email is verified - creates the
   * backend Resident record. Safe to call again on subsequent logins too
   * (idempotent server-side).
   */
  const completeSync = useCallback(async ({ displayName, address, homeLatitude, homeLongitude } = {}) => {
    const profile = await syncResident({ displayName, address, homeLatitude, homeLongitude });
    setResident(profile);
    setStatus('ready');
    return profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await getMyProfile();
    setResident(profile);
    return profile;
  }, []);

  // --- Email/password (the only sign-in method) ----------------------------
  const signUpWithEmail = useCallback(async (email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Fire-and-forget from the caller's perspective - errors here shouldn't
    // block account creation, the "Resend" button on the verification
    // screen covers a failed/undelivered send.
    await sendEmailVerification(credential.user);
    // onAuthStateChanged fires next and drives status -> needsEmailVerification.
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  /**
   * Re-sends the verification link to the currently signed-in (but
   * unverified) user - used by the "Resend email" button.
   */
  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user to resend a verification email to.');
    }
    await sendEmailVerification(auth.currentUser);
  }, []);

  /**
   * Firebase's `user.emailVerified` flag is a snapshot from sign-in time
   * and does NOT update on its own after the user clicks the email link -
   * it only refreshes after `reload()` pulls the latest user record from
   * Firebase. Called by the "I've verified, continue" button.
   */
  const refreshVerificationStatus = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user to check.');
    }
    await reload(auth.currentUser);
    await auth.currentUser.getIdToken(true);
    setFirebaseUser(auth.currentUser);
    await loadResidentState(auth.currentUser);
    return auth.currentUser.emailVerified;
  }, [loadResidentState]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      resident,
      status,
      isAuthenticated: status === 'ready' || status === 'needsSync',
      completeSync,
      refreshProfile,
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      resendVerificationEmail,
      refreshVerificationStatus,
      signOut,
    }),
    [
      firebaseUser,
      resident,
      status,
      completeSync,
      refreshProfile,
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      resendVerificationEmail,
      refreshVerificationStatus,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
