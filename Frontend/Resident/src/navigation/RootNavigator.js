import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext.js';
import { LoadingOverlay } from '../components/LoadingOverlay.js';
import { registerForPushNotificationsAsync } from '../services/push.js';

import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen.js';
import { EmailVerificationScreen } from '../screens/auth/EmailVerificationScreen.js';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen.js';
import { MapScreen } from '../screens/main/MapScreen.js';
import { VendorDetailScreen } from '../screens/main/VendorDetailScreen.js';
import { ProfileScreen } from '../screens/main/ProfileScreen.js';

const AuthStack = createNativeStackNavigator();
const AppRootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="EmailAuth" component={EmailAuthScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Map" component={MapScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <MainStack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ title: 'Vendor' }} />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const { status, resident } = useAuth();

  useEffect(() => {
    if (status === 'ready' && resident?.hasLocation) {
      registerForPushNotificationsAsync().catch((err) =>
        console.warn('[push] Registration failed:', err.message)
      );
    }
  }, [status, resident]);

  if (status === 'loading') {
    return <LoadingOverlay label="Loading VendiConnect…" />;
  }

  const showOnboarding = status === 'needsSync' || (status === 'ready' && !resident?.hasLocation);

  return (
    <NavigationContainer>
      <AppRootStack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'signedOut' && <AppRootStack.Screen name="Auth" component={AuthNavigator} />}
        {status === 'needsEmailVerification' && (
          <AppRootStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        )}
        {showOnboarding && <AppRootStack.Screen name="Onboarding" component={OnboardingScreen} />}
        {status === 'ready' && !showOnboarding && (
          <AppRootStack.Screen name="Main" component={MainNavigator} />
        )}
      </AppRootStack.Navigator>
    </NavigationContainer>
  );
}
