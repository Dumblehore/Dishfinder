import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Address = {
  id: string;
  label: string; // 'Home', 'Work', 'Other'
  name: string;
  lat: number;
  lng: number;
  isActive: boolean;
};

const STORAGE_KEY = 'dishfinder_addresses';

export function useLocation() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAddresses();
    const sub = DeviceEventEmitter.addListener('ADDRESS_UPDATED', loadAddresses);
    return () => sub.remove();
  }, []);

  const loadAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAddresses(JSON.parse(stored));
        setReady(true);
      } else {
        await initGPSAddress();
      }
    } catch {
      await initGPSAddress();
    }
  };

  const initGPSAddress = async () => {
    let lat = 28.6139;
    let lng = 77.2090;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch {}

    const gpsAddr: Address = {
      id: 'gps-current',
      label: 'Other',
      name: 'Current Location',
      lat, lng,
      isActive: true
    };
    await saveAddresses([gpsAddr]);
    setReady(true);
  };

  const saveAddresses = async (newAddresses: Address[]) => {
    setAddresses(newAddresses);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAddresses));
    DeviceEventEmitter.emit('ADDRESS_UPDATED');
  };

  const getLatestAddresses = async (): Promise<Address[]> => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const addAddress = async (label: string, name: string, lat: number, lng: number) => {
    const current = await getLatestAddresses();
    const newAddr: Address = {
      id: Date.now().toString(),
      label, name, lat, lng,
      isActive: true
    };
    const updated = current.map(a => ({ ...a, isActive: false })).concat(newAddr);
    await saveAddresses(updated);
  };

  const setGPSAddress = async (lat: number, lng: number) => {
    const current = await getLatestAddresses();
    let updated = current.map(a => ({ ...a, isActive: false }));
    const gpsIndex = updated.findIndex(a => a.id === 'gps-current');
    if (gpsIndex >= 0) {
      updated[gpsIndex] = { ...updated[gpsIndex], lat, lng, isActive: true };
    } else {
      updated.unshift({
        id: 'gps-current',
        label: 'Current',
        name: 'GPS Location',
        lat, lng,
        isActive: true
      });
    }
    await saveAddresses(updated);
  };

  const removeAddress = async (id: string) => {
    const current = await getLatestAddresses();
    let updated = current.filter(a => a.id !== id);
    if (updated.length > 0 && !updated.some(a => a.isActive)) {
      updated[0].isActive = true;
    }
    await saveAddresses(updated);
  };

  const setActiveAddress = async (id: string) => {
    const current = await getLatestAddresses();
    const updated = current.map(a => ({ ...a, isActive: a.id === id }));
    await saveAddresses(updated);
  };

  const activeAddress = addresses.find(a => a.isActive) || addresses[0];
  const coords = activeAddress ? { lat: activeAddress.lat, lng: activeAddress.lng } : { lat: 28.6139, lng: 77.2090 };

  return { coords, activeAddress, addresses, ready, addAddress, removeAddress, setActiveAddress, setGPSAddress };
}
