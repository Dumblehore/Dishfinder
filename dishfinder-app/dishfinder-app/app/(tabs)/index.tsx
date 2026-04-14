import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity, StatusBar
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useSearch } from '../../hooks/useSearch';
import DishCard from '../../components/DishCard';

const COLORS = {
  background: '#121416',
  surface: '#1a1c1e',
  surfaceHigh: '#282a2c',
  surfaceHighest: '#333537',
  primary: '#adc7ff',
  primaryDim: 'rgba(173,199,255,0.15)',
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c1c6d7',
  outline: '#414754',
  outlineFaint: 'rgba(65,71,84,0.5)',
};

// Builds the editorial section title from the query
const getEditTitle = (query: string) => {
  if (!query.trim()) return 'Around You';
  const q = query.trim();
  return `The ${q.charAt(0).toUpperCase() + q.slice(1)} Edit`;
};

// Groups results into proximity buckets for section dividers
const buildSections = (results: any[]) => {
  if (results.length === 0) return [];
  const nearby = results.filter(r => r.distance <= 1000);
  const within5 = results.filter(r => r.distance > 1000 && r.distance <= 5000);
  const cityWide = results.filter(r => r.distance > 5000);
  const out: any[] = [];
  if (nearby.length) { out.push({ type: 'header', label: 'Nearby', sub: '< 1 km', color: '#34C759' }); out.push(...nearby); }
  if (within5.length) { out.push({ type: 'header', label: 'Within 5 km', sub: '1 – 5 km', color: '#adc7ff' }); out.push(...within5); }
  if (cityWide.length) { out.push({ type: 'header', label: 'City-wide', sub: '5 km+', color: '#ffb695' }); out.push(...cityWide); }
  return out;
};

export default function SearchScreen() {
  const { query, setQuery, sortBy, setSortBy, results, loading, error } = useSearch();
  const flatListRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useScrollToTop(flatListRef);

  const listData = useMemo(() => buildSections(results), [results]);

  const FILTERS = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Nearest', value: 'distance' },
    { label: 'Cheapest', value: 'price' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── TOP APP BAR ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarIcon}>⊕</Text>
          <Text style={styles.topBarTitle}>
            Dish<Text style={styles.topBarAccent}>Finder</Text>
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 16 }}>👤</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item, i) => item.type === 'header' ? `h-${i}` : item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}

        // ── HEADER: search + filters + editorial title ──
        ListHeaderComponent={
          <View>
            {/* Search input */}
            <View style={[styles.searchWrapper, isFocused && styles.searchWrapperFocused]}>
              <Text style={styles.searchIconText}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g. Momos, Biryani, Chai..."
                placeholderTextColor="#8b90a0"
                value={query}
                onChangeText={setQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="none"
                selectionColor={COLORS.primary}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterChip, sortBy === f.value && styles.filterChipActive]}
                  onPress={() => setSortBy(f.value)}
                >
                  <Text style={[styles.filterChipText, sortBy === f.value && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            )}
          </View>
        }

        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"

        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: item.color }]} />
                <Text style={[styles.sectionLabel, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.sectionSub}>{item.sub}</Text>
                <View style={styles.sectionLine} />
              </View>
            );
          }
          return <DishCard item={item} />;
        }}

        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{query ? '🤔' : '🍜'}</Text>
              <Text style={styles.emptyTitle}>{query ? 'Nothing found nearby' : 'What are you craving?'}</Text>
              <Text style={styles.emptySub}>
                {query
                  ? `We couldn't find "${query}" around here. Try something else!`
                  : 'Search for any dish — momos, biryani, thali, chai...'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Top app bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.outline,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarIcon: { fontSize: 22, color: COLORS.primary },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  topBarAccent: { color: COLORS.primary },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 1.5, borderColor: COLORS.outline,
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 20 },

  // Search bar
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.outline,
    marginBottom: 14,
    gap: 10,
  },
  searchWrapperFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  searchIconText: { fontSize: 20, color: COLORS.onSurfaceVariant },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.onSurface, fontWeight: '500' },
  clearText: { color: COLORS.onSurfaceVariant, fontSize: 15, fontWeight: '700' },

  // Filters
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  filterChipTextActive: { color: '#002e68', fontWeight: '700' },

  // Editorial header
  editorialHeader: { marginBottom: 20 },
  editorialEyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  editorialTitle: {
    color: COLORS.onSurface,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },

  // Section dividers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    gap: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  sectionSub: { fontSize: 11, color: '#8b90a0', fontWeight: '500' },
  sectionLine: { flex: 1, height: 0.5, backgroundColor: COLORS.outline },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { color: '#ff6b6b', fontWeight: '600', fontSize: 14 },

  // Empty state
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 28 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface, marginBottom: 10, textAlign: 'center' },
  emptySub: { color: COLORS.onSurfaceVariant, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  loadingOverlay: { position: 'absolute', top: 110, right: 22 },
});
