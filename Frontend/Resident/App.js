import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext.js';
import { LocationProvider } from './src/context/LocationContext.js';
import { RootNavigator } from './src/navigation/RootNavigator.js';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
