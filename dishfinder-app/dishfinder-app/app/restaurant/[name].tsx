import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  StatusBar, TouchableOpacity, Linking, Platform, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';

const API_BASE = 'https://dishfinder-uez2.onrender.com';
const RESTAURANT_API = `${API_BASE}/api/search/restaurant`;

const COLORS = {
  background:  '#121416',
  surface:     '#1a1c1e',
  surfaceHigh: '#282a2c',
  primary:     '#adc7ff',
  onSurface:   '#e2e2e5',
  onSurfaceVariant: '#c1c6d7',
  outline:     '#414754',
};

function openMaps(lat: number, lng: number) {
  const url = Platform.select({
    ios:     `googlemaps://?daddr=${lat},${lng}&directionsmode=driving`,
    android: `google.navigation:q=${lat},${lng}`,
  }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.canOpenURL(url).then(ok =>
    Linking.openURL(ok ? url : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
  );
}

export default function RestaurantScreen() {
  const params = useLocalSearchParams<{ name: string; lat: string; lng: string }>();
  const restaurantName = params.name || '';
  const passedLat      = parseFloat(params.lat || '0');
  const passedLng      = parseFloat(params.lng || '0');
  const { coords }     = useLocation();

  const [dishes,  setDishes]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating,  setRating]  = useState<number | null>(null);

  useEffect(() => {
    if (!restaurantName) return;
    fetchDishes();
  }, [restaurantName]);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const lat = passedLat || coords.lat;
      const lng = passedLng || coords.lng;
      const url = `${RESTAURANT_API}?name=${encodeURIComponent(restaurantName)}&lat=${lat}&lng=${lng}`;
      const res  = await fetch(url);
      const data = await res.json();
      const results = data.results || [];
      setDishes(results);
      if (results.length > 0) setRating(results[0].rating);
    } catch {
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  const dishLat = passedLat || coords.lat;
  const dishLng = passedLng || coords.lng;

  const renderDish = ({ item }: { item: any }) => (
    <View style={styles.dishRow}>
      <View style={styles.dishLeft}>
        <Text style={styles.dishName}>{item.dish_name}</Text>
        {item.is_rare && (
          <View style={styles.rarePill}>
            <Text style={styles.rareText}>💎 Rare</Text>
          </View>
        )}
      </View>
      <Text style={styles.dishPrice}>₹{item.price}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{restaurantName}</Text>
          {rating !== null && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Directions banner ── */}
      <TouchableOpacity
        style={styles.directionsBanner}
        onPress={() => openMaps(dishLat, dishLng)}
        activeOpacity={0.8}
      >
        <Text style={styles.dirEmoji}>📍</Text>
        <Text style={styles.dirText}>Get Directions to {restaurantName}</Text>
        <Text style={styles.dirArrow}>→</Text>
      </TouchableOpacity>

      {/* ── Dish list ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Loading menu…</Text>
        </View>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={d => d._id}
          renderItem={renderDish}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <Text style={styles.menuCount}>{dishes.length} items</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyText}>No dishes found for this restaurant.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.background },
  header:      { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 8, gap: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.outline,
  },
  backIcon:    { color: COLORS.onSurface, fontSize: 20 },
  headerCenter:{ flex: 1 },
  headerTitle: { color: COLORS.onSurface, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingStar:  { color: '#adc7ff', fontSize: 13 },
  ratingVal:   { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '600' },

  directionsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    padding: 14,
    backgroundColor: 'rgba(173,199,255,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(173,199,255,0.25)',
    gap: 10,
  },
  dirEmoji: { fontSize: 20 },
  dirText:  { flex: 1, color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  dirArrow: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  menuHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  menuTitle: { color: COLORS.onSurface, fontSize: 18, fontWeight: '800' },
  menuCount: { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '500' },

  dishRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  dishLeft:  { flex: 1, marginRight: 12, gap: 4 },
  dishName:  { color: COLORS.onSurface, fontSize: 15, fontWeight: '600' },
  dishPrice: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  rarePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(100,41,127,0.3)',
    borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  rareText: { color: '#d4a5ff', fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: COLORS.outline, opacity: 0.4 },

  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: COLORS.onSurfaceVariant, fontSize: 14 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyText:  { color: COLORS.onSurfaceVariant, fontSize: 15, textAlign: 'center' },
});
