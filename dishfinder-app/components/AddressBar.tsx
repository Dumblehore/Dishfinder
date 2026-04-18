import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AddressBarProps {
  label: string;
  name: string;
  onPress: () => void;
}

export default function AddressBar({ label, name, onPress }: AddressBarProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.container} onPress={onPress}>
      <Text style={styles.deliveringLabel}>Delivering to</Text>
      <View style={styles.row}>
        <Text style={styles.pin}>📍</Text>
        <Text style={styles.mainTitle}>{label}</Text>
        <Text style={styles.chevron}>˅</Text>
      </View>
      <Text style={styles.subtext} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  deliveringLabel: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pin: {
    fontSize: 18,
    color: '#FF5A5F', // Overridden by native emoji, but good practice
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chevron: {
    color: '#FF5A5F',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  subtext: {
    color: '#8b90a0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});
