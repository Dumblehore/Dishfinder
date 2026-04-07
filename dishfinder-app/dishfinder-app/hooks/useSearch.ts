import { useState, useEffect } from 'react';

// Using localhost works for iOS Simulator, but Android Emulator needs 10.0.2.2!
// If testing on a physical phone via Expo Go, you MUST use your computer's local IP (e.g. 192.168.1.15)
const API_BASE_URL = 'http://localhost:5000'; 

export function useSearch() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDishes(query, sortBy);
    }, 400);

    return () => clearTimeout(handler);
  }, [query, sortBy]);

  const fetchDishes = async (searchQuery: string, sortParam: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Hardcoded to DIT University (Mussoorie Diversion, Dehradun) for MVP Testing!
      const lat = 30.3951;
      const lng = 78.0831;

      let url = `${API_BASE_URL}/api/search?lat=${lat}&lng=${lng}`;
      if (searchQuery.trim().length > 0) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      if (sortParam !== 'relevance') {
        url += `&sortBy=${sortParam}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Could not connect to the backend. Make sure your IP is correctly set in useSearch.ts');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { query, setQuery, sortBy, setSortBy, results, loading, error };
}
