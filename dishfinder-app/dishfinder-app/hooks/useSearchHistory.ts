import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@dishfinder_history';
const MAX  = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  const addToHistory = useCallback((term: string) => {
    if (!term.trim() || term.trim().length < 2) return;
    setHistory(prev => {
      const updated = [term.trim(), ...prev.filter(h => h.toLowerCase() !== term.trim().toLowerCase())].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
