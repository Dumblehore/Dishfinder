import React from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useSearch } from '../../hooks/useSearch';
import DishCard from '../../components/DishCard';

export default function SearchScreen() {
  const { query, setQuery, results, loading, error } = useSearch();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header / Search Bar */}
        <View style={styles.header}>
          <Text style={styles.title}>Dish<Text style={styles.titleAccent}>Finder</Text></Text>
          <Text style={styles.subtitle}>Discover specific dishes across your city.</Text>
          
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Craving something specific? (e.g. Momos)"
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Status / Error Messages */}
        {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorSubtext}>Check console or useSearch.ts for IP setup!</Text>
            </View>
        )}

        {/* Results List */}
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <DishCard item={item} />}
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{query ? '🤔' : '🍜'}</Text>
                <Text style={styles.emptyText}>
                  {query ? "We couldn't find that exact dish here." : "Type a dish to magically find the best spots!"}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Loading Indicator Overlay (subtle) */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF5A5F" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212', // Deep Charcoal
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#FF5A5F', // Ember Orange
  },
  subtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 6,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    position: 'absolute',
    top: 140, // Below header
    right: 30,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 95, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5A5F',
    fontWeight: 'bold',
  },
  errorSubtext: {
    color: '#FF5A5F',
    opacity: 0.8,
    fontSize: 12,
    marginTop: 4,
  }
});
