import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DishCard({ item }: { item: any }) {

  // A tiny helper to pick tag colors purely based on text
  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'Closest': return { backgroundColor: '#E8F5E9', color: '#34C759' }; // Apple Green
      case 'Cheapest': return { backgroundColor: '#E3F2FD', color: '#007AFF' }; // Apple Blue
      case 'Best Value': return { backgroundColor: '#FFF8E1', color: '#FF9500' }; // Apple Orange
      default: return { backgroundColor: '#F2F2F7', color: '#8E8E93' }; // System Gray
    }
  };

  // Convert distance to KM if it's large, otherwise keep meters
  const formattedDistance = item.distance > 1000
    ? `${(item.distance / 1000).toFixed(1)} km`
    : `${Math.round(item.distance)} m`;

  return (
    <View style={styles.cardContainer}>
      {/* TOP ROW: Rating & Distance */}
      <View style={styles.row}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.distanceText}>{formattedDistance} away</Text>
      </View>

      {/* MIDDLE ROW: Names */}
      <Text style={styles.dishName}>{item.dish_name}</Text>
      <Text style={styles.restaurantName}>🚩 {item.restaurant_name}</Text>

      {/* BOTTOM ROW: Price & Tags */}
      <View style={[styles.row, { marginTop: 12 }]}>
        <Text style={styles.price}>₹{item.price}</Text>

        <View style={styles.tagsContainer}>
          {item.tags?.map((tag: string, index: number) => {
            const colors = getTagStyle(tag);
            return (
              <View key={index} style={[styles.tagBadge, { backgroundColor: colors.backgroundColor }]}>
                <Text style={[styles.tagText, { color: colors.color }]}>{tag}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#000000ff', // Pure white background
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, // Ultra-thin iOS border divider
    borderBottomColor: '#E5E5EA', // Apple System Gray 5
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FF9500',
    fontWeight: '600',
    fontSize: 67,
  },
  distanceText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '400',
  },
  dishName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  restaurantName: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});
