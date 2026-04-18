import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Linking, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useFavorites } from '../../hooks/useFavorites';
import DishCard from '../../components/DishCard';

// Pointing to Production backend for deployment
const API_BASE_URL = 'https://dishfinder-uez2.onrender.com';

export default function RestaurantDetailScreen() {
  const { name, lat, lng, dishId } = useLocalSearchParams();
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(dishId as string);

  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name || !lat || !lng) return;
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/search/restaurant?name=${encodeURIComponent(name as string)}&lat=${lat}&lng=${lng}`);
        if (!response.ok) throw new Error('API 404');
        const data = await response.json();
        setDishes(data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [name, lat, lng]);

  const openMaps = () => {
    if (!lat || !lng) return;
    const url = Platform.select({
      ios: `googlemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}`,
    }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.canOpenURL(url).then(supported => {
      Linking.openURL(supported ? url : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const shareRestaurant = () => {
    Share.share({ message: `Check out ${name} on CraveMap!` });
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
          <Text style={styles.circleBtnIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.navRowRight}>
          <TouchableOpacity style={styles.circleBtn} onPress={shareRestaurant}>
            <Text style={styles.circleBtnIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerTitleBox}>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity style={styles.primaryAction} onPress={openMaps} activeOpacity={0.8}>
          <Text style={styles.primaryActionIcon}>📍</Text>
          <Text style={styles.primaryActionText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Full Menu ({dishes.length})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#267cb5" />
          <Text style={styles.loadingText}>Fetching menu...</Text>
        </View>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item, index) => item._id || index.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <DishCard item={item} />}
          ListEmptyComponent={
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No menu data available yet.</Text>
             </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1a21' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#c1c6d7', marginTop: 12, fontSize: 16, fontWeight: '600' },
  listContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  headerContainer: { marginBottom: 24 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  navRowRight: { flexDirection: 'row', gap: 12 },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#162d3a',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#267cb5',
  },
  circleBtnIcon: { fontSize: 20, color: '#267cb5', fontWeight: 'bold' },
  headerTitleBox: { marginBottom: 32 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 16 },
  primaryAction: { backgroundColor: '#267cb5', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  primaryActionIcon: { fontSize: 18 },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sectionTitle: { fontSize: 20, color: '#e2e2e5', fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  emptyContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#c1c6d7', fontSize: 16 },
});
