import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  const loadHistory = async () => {
    const res = await AsyncStorage.getItem('dishfinder_history');
    if (res) setHistory(JSON.parse(res));
    else setHistory([]);
  };

  useEffect(() => {
    loadHistory();
    const sub = DeviceEventEmitter.addListener('SEARCH_HISTORY_UPDATED', loadHistory);
    return () => sub.remove();
  }, []);

  const addToHistory = async (query: string) => {
    let newHistory = history.filter(h => h.toLowerCase() !== query.toLowerCase());
    newHistory.unshift(query);
    if (newHistory.length > 8) newHistory = newHistory.slice(0, 8);
    setHistory(newHistory);
    await AsyncStorage.setItem('dishfinder_history', JSON.stringify(newHistory));
    DeviceEventEmitter.emit('SEARCH_HISTORY_UPDATED');
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('dishfinder_history');
    DeviceEventEmitter.emit('SEARCH_HISTORY_UPDATED');
  };

  return { history, addToHistory, clearHistory };
}
