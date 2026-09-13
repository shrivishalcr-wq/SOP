import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE_CONFIG || '{}');

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws if called twice (e.g. on fast refresh) - fall back
// to getAuth() in that case rather than crashing the app.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { app, auth };
