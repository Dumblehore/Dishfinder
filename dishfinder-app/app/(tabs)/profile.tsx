import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '../../hooks/useFavorites';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import DishCard from '../../components/DishCard';

const COLORS = {
  background: '#121416',
  surface: '#1a1c1e',
  surfaceHighest: '#333537',
  primary: '#adc7ff',
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c1c6d7',
  danger: '#ff6b6b',
};

export default function ProfileScreen() {
  const { favorites, clearAllFavorites } = useFavorites();
  const { history, clearHistory } = useSearchHistory();
  const insets = useSafeAreaInsets();

  const handleClearHistory = () => {
    Alert.alert('Clear History?', 'This will wipe out all your recent searches.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  const handleClearFavorites = () => {
    Alert.alert('Clear Favorites?', 'This will remove all your saved dishes.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAllFavorites },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── STATS SECTION ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{history.length}</Text>
            <Text style={styles.statLabel}>Searches</Text>
          </View>
        </View>

        {/* ── SETTINGS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleClearHistory}>
            <Text style={styles.actionBtnText}>🗑️ Clear Search History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleClearFavorites}>
            <Text style={styles.actionBtnTextDanger}>❤️ Clear All Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* ── FAVORITES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liked Dishes</Text>
          {favorites.length === 0 ? (
             <View style={styles.emptyBox}>
               <Text style={styles.emptyText}>You haven't favorited any dishes yet.</Text>
             </View>
          ) : (
            favorites.map((dish, i) => (
              <DishCard key={`fav-${i}`} item={dish} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32, marginTop: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, padding: 20,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#282a2c'
  },
  statNumber: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '600', marginTop: 4 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, marginBottom: 16, marginLeft: 4 },
  actionBtn: {
    backgroundColor: COLORS.surface, padding: 18, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  actionBtnText: { color: COLORS.onSurface, fontSize: 16, fontWeight: '600' },
  actionBtnTextDanger: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  emptyBox: {
    backgroundColor: 'rgba(255,255,255,0.03)', padding: 30, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  emptyText: { color: COLORS.onSurfaceVariant, fontSize: 15, fontWeight: '500' }
});
