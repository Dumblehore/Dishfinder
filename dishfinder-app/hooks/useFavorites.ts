import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<any[]>([]);

  const loadFavorites = async () => {
    const res = await AsyncStorage.getItem('dishfinder_favorites');
    if (res) setFavorites(JSON.parse(res));
    else setFavorites([]);
  };

  useEffect(() => {
    loadFavorites();
    const sub = DeviceEventEmitter.addListener('FAVORITES_UPDATED', loadFavorites);
    return () => sub.remove();
  }, []);

  const toggleFavorite = async (dish: any) => {
    let newFavs = [...favorites];
    const index = newFavs.findIndex(f => f._id === dish._id);
    if (index >= 0) newFavs.splice(index, 1);
    else newFavs.push(dish);
    setFavorites(newFavs);
    await AsyncStorage.setItem('dishfinder_favorites', JSON.stringify(newFavs));
    DeviceEventEmitter.emit('FAVORITES_UPDATED');
  };

  const isFavorited = (dishId: string) => favorites.some(f => f._id === dishId);

  const clearAllFavorites = async () => {
    setFavorites([]);
    await AsyncStorage.removeItem('dishfinder_favorites');
    DeviceEventEmitter.emit('FAVORITES_UPDATED');
  };

  return { favorites, toggleFavorite, isFavorited, clearAllFavorites };
}
