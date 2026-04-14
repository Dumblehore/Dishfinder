import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  SafeAreaView, TouchableOpacity, StatusBar, ScrollView, Keyboard
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useSearch } from '../../hooks/useSearch';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import DishCard from '../../components/DishCard';
import SkeletonCard from '../../components/SkeletonCard';

const COLORS = {
  background:        '#121416',
  surface:           '#1a1c1e',
  surfaceHigh:       '#282a2c',
  surfaceHighest:    '#333537',
  primary:           '#adc7ff',
  primaryDim:        'rgba(173,199,255,0.15)',
  onSurface:         '#e2e2e5',
  onSurfaceVariant:  '#c1c6d7',
  outline:           '#414754',
  outlineFaint:      'rgba(65,71,84,0.5)',
  vegGreen:          '#30d158',
  nonVegRed:         '#ff6b6b',
};

// ── Veg / Non-Veg classifier (word-boundary safe) ────────────────────────────
const VEG_WORDS    = ['paneer','dosa','dal','idli','vada','chaat','aloo','gobi',
                      'palak','rajma','chole','halwa','kheer','gulab','samosa',
                      'poha','upma','paratha','puri','kadhi','raita','lassi',
                      'shahi','toffu','tofu','uttapam','dhokla'];
const NONVEG_WORDS = ['chicken','mutton','fish','prawn','egg','keema','seekh',
                      'salmon','lamb','beef','pork','crab','squid','duck',
                      'sausage','bacon','steak','tikka chicken','boneless'];

function isNonVeg(dishName: string): boolean {
  const n = dishName.toLowerCase();
  return NONVEG_WORDS.some(w => new RegExp(`\\b${w}\\b`).test(n));
}

// ── Distance-based sections (only in Relevance mode) ─────────────────────────
const buildSections = (results: any[], sortBy: string) => {
  if (results.length === 0) return [];
  if (sortBy !== 'relevance') return results;

  const nearby   = results.filter(r => r.distance <= 1000);
  const within5  = results.filter(r => r.distance > 1000 && r.distance <= 5000);
  const cityWide = results.filter(r => r.distance > 5000);
  const out: any[] = [];
  if (nearby.length)   { out.push({ type: 'header', label: 'Nearby',      sub: '< 1 km',   color: '#34C759' }); out.push(...nearby);   }
  if (within5.length)  { out.push({ type: 'header', label: 'Within 5 km', sub: '1 – 5 km', color: '#adc7ff' }); out.push(...within5);  }
  if (cityWide.length) { out.push({ type: 'header', label: 'City-wide',   sub: '5 km+',    color: '#ffb695' }); out.push(...cityWide); }
  return out;
};

export default function SearchScreen() {
  const { query, setQuery, sortBy, setSortBy, results, loading, error, slowServer } = useSearch();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const flatListRef  = useRef(null);
  const inputRef     = useRef<TextInput>(null);
  const [isFocused, setIsFocused]   = useState(false);
  const [vegFilter, setVegFilter]   = useState<'all' | 'veg' | 'nonveg'>('all');

  useScrollToTop(flatListRef);

  // Apply veg filter on top of API results
  const filteredResults = useMemo(() => {
    if (vegFilter === 'all')    return results;
    if (vegFilter === 'nonveg') return results.filter(r => isNonVeg(r.dish_name));
    return results.filter(r => !isNonVeg(r.dish_name)); // veg
  }, [results, vegFilter]);

  const listData = useMemo(() => buildSections(filteredResults, sortBy), [filteredResults, sortBy]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (query.trim()) addToHistory(query.trim());
  };

  const applyHistory = (term: string) => {
    setQuery(term);
    addToHistory(term);
  };

  const SORT_FILTERS = [
    { label: 'Relevance', value: 'relevance' },
    { label: '📍 Nearest',  value: 'distance'  },
    { label: '💰 Cheapest', value: 'price'      },
  ];

  const showHistory = !query && history.length > 0 && isFocused;

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

      {/* ── HEADER CONTENT (Search, History, Filters) ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        {/* ── Search bar ── */}
        <View style={[styles.searchWrapper, isFocused && styles.searchWrapperFocused]}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => {
              if (query.trim().length > 0) handleSubmit();
              else inputRef.current?.focus();
            }}
          >
            <Text style={styles.searchIconText}>⌕</Text>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="e.g. Momos, Biryani, Chai..."
            placeholderTextColor="#8b90a0"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmit}
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

        {/* ── History chips ── */}
        {showHistory && (
          <View style={styles.historyBox}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.historyClear}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
              {history.map((h, i) => (
                <TouchableOpacity key={i} style={styles.historyChip} onPress={() => applyHistory(h)}>
                  <Text style={styles.historyChipText}>🕐 {h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Sort filters ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {SORT_FILTERS.map(f => (
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

            {/* Divider */}
            <View style={styles.filterDivider} />

            {/* Veg toggle */}
            <TouchableOpacity
              style={[styles.filterChip, vegFilter === 'veg' && styles.vegChipActive]}
              onPress={() => setVegFilter(v => v === 'veg' ? 'all' : 'veg')}
            >
              <Text style={[styles.filterChipText, vegFilter === 'veg' && { color: COLORS.vegGreen, fontWeight: '700' }]}>
                🌿 Veg
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, vegFilter === 'nonveg' && styles.nonVegChipActive]}
              onPress={() => setVegFilter(v => v === 'nonveg' ? 'all' : 'nonveg')}
            >
              <Text style={[styles.filterChipText, vegFilter === 'nonveg' && { color: COLORS.nonVegRed, fontWeight: '700' }]}>
                🍗 Non-Veg
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      </View>

      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item, i) => item.type === 'header' ? `h-${i}` : item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"

        ListHeaderComponent={
          <>
            {/* ── Error ── */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            )}

            {/* ── Slow server warning ── */}
            {slowServer && loading && (
              <View style={styles.slowBox}>
                <Text style={styles.slowText}>🐢  Server warming up… this takes ~10s on the first search. Hang tight!</Text>
              </View>
            )}
          </>
        }

        renderItem={({ item }) => {
          if (loading) return null;
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
          loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{query ? '🤔' : '🍜'}</Text>
              <Text style={styles.emptyTitle}>{query ? 'Nothing found nearby' : 'What are you craving?'}</Text>
              <Text style={styles.emptySub}>
                {query
                  ? `No "${query}" around here. Try something else or switch to City-wide.`
                  : 'Search for any dish — momos, biryani, thali, chai...'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 0.5, borderBottomColor: COLORS.outline,
  },
  topBarLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarIcon:   { fontSize: 22, color: COLORS.primary },
  topBarTitle:  { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  topBarAccent: { color: COLORS.primary },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1.5, borderColor: COLORS.outline,
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 14, paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: COLORS.outline, marginBottom: 14, gap: 10,
  },
  searchWrapperFocused: {
    borderColor: COLORS.primary, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  searchIconText: { fontSize: 20, color: COLORS.onSurfaceVariant },
  searchInput:    { flex: 1, fontSize: 16, color: COLORS.onSurface, fontWeight: '500' },
  clearText:      { color: COLORS.onSurfaceVariant, fontSize: 15, fontWeight: '700' },

  // History
  historyBox: { marginBottom: 12 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyTitle:  { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  historyClear:  { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  historyScroll: { flexGrow: 0 },
  historyChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.outline, marginRight: 8,
  },
  historyChipText: { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '500' },

  // Filters
  filterScroll: { marginBottom: 20 },
  filterRow:    { flexDirection: 'row', gap: 8, paddingRight: 16 },
  filterDivider: { width: 1, height: 30, backgroundColor: COLORS.outline, alignSelf: 'center', marginHorizontal: 4 },
  filterChip: {
    paddingVertical: 7, paddingHorizontal: 16, borderRadius: 9999,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive:   { backgroundColor: COLORS.primary },
  vegChipActive:      { backgroundColor: 'rgba(48,209,88,0.15)', borderColor: COLORS.vegGreen },
  nonVegChipActive:   { backgroundColor: 'rgba(255,107,107,0.15)', borderColor: COLORS.nonVegRed },
  filterChipText:     { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  filterChipTextActive:{ color: '#002e68', fontWeight: '700' },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4, gap: 8 },
  sectionDot:    { width: 8, height: 8, borderRadius: 4 },
  sectionLabel:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  sectionSub:    { fontSize: 11, color: '#8b90a0', fontWeight: '500' },
  sectionLine:   { flex: 1, height: 0.5, backgroundColor: COLORS.outline },

  // Errors & warnings
  errorBox: { backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText: { color: '#ff6b6b', fontWeight: '600', fontSize: 14 },
  slowBox:  { backgroundColor: 'rgba(255,182,0,0.1)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,182,0,0.3)' },
  slowText: { color: '#ffd60a', fontWeight: '500', fontSize: 13, lineHeight: 20 },

  // Empty state
  empty:      { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 28 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface, marginBottom: 10, textAlign: 'center' },
  emptySub:   { color: COLORS.onSurfaceVariant, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
