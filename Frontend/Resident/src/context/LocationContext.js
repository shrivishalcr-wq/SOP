import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [error, setError] = useState(null);

  const requestAndFetch = useCallback(async () => {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);

    if (status !== 'granted') {
      setError('Location permission was not granted');
      return null;
    }

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(next);
      return next;
    } catch (err) {
      setError(err.message || 'Failed to read current location');
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ coords, permissionStatus, error, requestAndFetch }),
    [coords, permissionStatus, error, requestAndFetch]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useResidentLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useResidentLocation must be used within a LocationProvider');
  return ctx;
}
