import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, ScrollView
} from 'react-native';
import DishCard from '../../components/DishCard';

const API_BASE_URL = 'https://dishfinder-uez2.onrender.com';
const LAT = 30.3951;
const LNG = 78.0831;

const COLORS = {
  background: '#121416',
  surface: '#1a1c1e',
  surfaceHigh: '#282a2c',
  surfaceHighest: '#333537',
  primary: '#adc7ff',
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c1c6d7',
  outline: '#414754',
};

// Category cards for the browse grid
const CATEGORIES = [
  { label: 'Momos',      emoji: '🥟', query: 'momo',    color: '#1a2a4a' },
  { label: 'Biryani',    emoji: '🍛', query: 'biryani', color: '#2a1a10' },
  { label: 'Chicken',    emoji: '🍗', query: 'chicken', color: '#2a1a20' },
  { label: 'Paneer',     emoji: '🧀', query: 'paneer',  color: '#1a2a1a' },
  { label: 'Rice',       emoji: '🍚', query: 'rice',    color: '#1e1e10' },
  { label: 'Chai',       emoji: '☕', query: 'chai',    color: '#1c1a10' },
  { label: 'Thali',      emoji: '🍽️', query: 'thali',  color: '#2a1a2a' },
  { label: 'Parantha',   emoji: '🫓', query: 'parantha',color: '#2a2010' },
  { label: 'Noodles',    emoji: '🍜', query: 'noodle', color: '#101a2a' },
  { label: 'Kebab',      emoji: '🍢', query: 'kebab',  color: '#2a1510' },
  { label: 'Dal',        emoji: '🫘', query: 'dal',     color: '#1a2a10' },
  { label: 'Cold Drink', emoji: '🥤', query: 'juice',  color: '#101e2a' },
];

export default function ExploreScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCategory = async (query: string) => {
    if (selected === query) {
      // Deselect
      setSelected(null);
      setResults([]);
      return;
    }
    setSelected(query);
    setLoading(true);
    setResults([]);
    try {
      const url = `${API_BASE_URL}/api/search?lat=${LAT}&lng=${LNG}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.query === selected);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Browse by category</Text>
      </View>

      {/* ── Category chips (horizontal scroll) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.query}
            style={[
              styles.chip,
              selected === cat.query && styles.chipActive,
              selected === cat.query && { borderColor: COLORS.primary }
            ]}
            onPress={() => handleCategory(cat.query)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipEmoji}>{cat.emoji}</Text>
            <Text style={[styles.chipLabel, selected === cat.query && styles.chipLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Results ── */}
      {!selected ? (
        // No category selected state
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👆</Text>
          <Text style={styles.emptyTitle}>Pick a category</Text>
          <Text style={styles.emptySub}>Tap any category above to browse dishes near you</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Finding {selectedCategory?.label} near you...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>😔</Text>
          <Text style={styles.emptyTitle}>Nothing found</Text>
          <Text style={styles.emptySub}>
            No {selectedCategory?.label} spots found nearby. Try another category!
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.resultHeader}>
              <View style={styles.resultHeaderLeft}>
                <View style={[styles.resultDot, { backgroundColor: selectedCategory?.color ?? COLORS.primary }]} />
                <Text style={styles.resultCount}>{results.length} spots found for <Text style={{ color: COLORS.primary }}>{selectedCategory?.label}</Text></Text>
              </View>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setSelected(null); setResults([]); }}
              >
                <Text style={styles.clearBtnText}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <DishCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.outline,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2 },

  // Chips
  chipsScroll: {
    maxHeight: 72,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.outline,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceHighest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(173,199,255,0.12)',
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  chipLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // Empty / loading
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  emptySub: { color: COLORS.onSurfaceVariant, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: COLORS.onSurfaceVariant, fontSize: 15 },

  // Results list
  list: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultCount: { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '600' },
  clearBtn: {
    backgroundColor: 'rgba(173,199,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(173,199,255,0.3)',
  },
  clearBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
