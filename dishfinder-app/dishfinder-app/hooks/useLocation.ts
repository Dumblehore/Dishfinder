import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const DEFAULT_LAT = 28.6139; // Delhi centre fallback
const DEFAULT_LNG = 77.2090;

export type Coords = { lat: number; lng: number };

export function useLocation() {
  const [coords, setCoords] = useState<Coords>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  return { coords, ready };
}
