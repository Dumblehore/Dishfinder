import { useState, useEffect, useRef } from 'react';
import { useLocation } from './useLocation';

const API_BASE_URL = 'https://dishfinder-uez2.onrender.com';

export function useSearch() {
  const { coords, ready } = useLocation();
  const [query, setQuery]     = useState('');
  const [sortBy, setSortBy]   = useState('relevance');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [slowServer, setSlowServer] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const handler = setTimeout(() => {
      fetchDishes(query, sortBy, coords);
    }, 400);
    return () => clearTimeout(handler);
  }, [query, sortBy, coords, ready]);

  const fetchDishes = async (
    searchQuery: string,
    sortParam: string,
    location: { lat: number; lng: number }
  ) => {
    setLoading(true);
    setError(null);
    setSlowServer(false);

    // Show "server warming up" warning after 2.5s
    const slowTimer = setTimeout(() => setSlowServer(true), 2500);

    try {
      let url = `${API_BASE_URL}/api/search?lat=${location.lat}&lng=${location.lng}`;
      if (searchQuery.trim().length > 0) url += `&q=${encodeURIComponent(searchQuery)}`;
      if (sortParam !== 'relevance')     url += `&sortBy=${sortParam}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Could not reach the server. Please try again.');
      setResults([]);
    } finally {
      clearTimeout(slowTimer);
      setSlowServer(false);
      setLoading(false);
    }
  };

  return { query, setQuery, sortBy, setSortBy, results, loading, error, slowServer };
}
