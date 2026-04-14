import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@dishfinder_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<any[]>([]);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setFavorites(JSON.parse(raw));
    });
  }, []);

  const isFavorited = useCallback(
    (id: string) => favorites.some(f => f._id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(async (item: any) => {
    setFavorites(prev => {
      const already = prev.some(f => f._id === item._id);
      const updated = already
        ? prev.filter(f => f._id !== item._id)
        : [item, ...prev]; // newest first
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllFavorites = useCallback(async () => {
    setFavorites([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { favorites, isFavorited, toggleFavorite, clearAllFavorites };
}
