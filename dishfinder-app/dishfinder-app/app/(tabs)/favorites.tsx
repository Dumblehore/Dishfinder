import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useFavorites } from '../../hooks/useFavorites';
import DishCard from '../../components/DishCard';

const COLORS = {
  background: '#121416',
  surface: '#1a1c1e',
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c1c6d7',
  outline: '#414754',
  primary: '#adc7ff',
};

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Favor<Text style={styles.titleAccent}>ites</Text>
        </Text>
        <Text style={styles.subtitle}>
          {favorites.length > 0 ? `${favorites.length} saved dish${favorites.length > 1 ? 'es' : ''}` : 'Nothing saved yet'}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🤍</Text>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySub}>
            Tap the ♡ heart button on any dish card to save it here for quick access later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={() => favorites.forEach(f => toggleFavorite(f))}
            >
              <Text style={styles.clearAllText}>✕  Clear all favorites</Text>
            </TouchableOpacity>
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
  titleAccent: { color: '#ff5252' },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -60,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  emptySub: { color: COLORS.onSurfaceVariant, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  clearAllBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
  },
  clearAllText: { color: '#ff5252', fontSize: 13, fontWeight: '700' },
});
