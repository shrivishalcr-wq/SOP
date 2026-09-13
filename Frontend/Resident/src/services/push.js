import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateFcmToken } from '../api/auth.js';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission and registers the device's raw FCM
 * token (Android) / APNs token (iOS) with the backend. Deliberately uses
 * getDevicePushTokenAsync() rather than getExpoPushTokenAsync() - the
 * backend calls firebase-admin's messaging().send({token}) directly with
 * a genuine platform token, not Expo's own push service.
 *
 * Requires a development build / EAS build (not Expo Go) since Expo Go
 * no longer supports remote push notifications on Android from SDK 53+.
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn('[push] Push notifications require a physical device or a proper emulator with Play Services');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[push] Notification permission was not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vendor-alerts', {
      name: 'Vendor proximity alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const tokenResponse = await Notifications.getDevicePushTokenAsync();
  const fcmToken = tokenResponse.data;

  try {
    await updateFcmToken(fcmToken);
  } catch (err) {
    console.warn('[push] Failed to register FCM token with backend:', err.message);
  }

  return fcmToken;
}

export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
