import { useState, useEffect, useCallback } from 'react';

// Using localhost works for iOS Simulator, but Android Emulator needs 10.0.2.2!
// If testing on a physical phone via Expo Go, you MUST use your computer's local IP (e.g. 192.168.1.15)
const API_BASE_URL = 'http://localhost:5000'; 

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDishes(query);
    }, 400); // 400ms delay for live search typing

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const fetchDishes = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Default to New Delhi (Connaught Place) for MVP testing.
      // In Production, we'd use expo-location to inject real device coords here.
      const lat = 28.6139;
      const lng = 77.2090;

      let url = `${API_BASE_URL}/api/search?lat=${lat}&lng=${lng}`;
      if (searchQuery.trim().length > 0) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      // NOTE: Fallback to an empty array to prevent crashing if the user is 
      // on a physical device and forgot to change localhost to their IP!
      setError('Could not connect to the backend. Make sure your IP is correctly set in useSearch.ts');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    refresh: () => fetchDishes(query)
  };
}
