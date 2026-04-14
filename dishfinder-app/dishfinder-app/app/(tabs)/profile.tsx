import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Sign in to personalise your experience.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121416', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#e2e2e5', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#8b90a0' },
});
