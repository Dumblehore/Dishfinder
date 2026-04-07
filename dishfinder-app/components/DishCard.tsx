import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DishCard({ item }: { item: any }) {

  // A tiny helper to pick tag colors purely based on text
  const getTagStyle = (tag: string) => {
    switch(tag) {
      case 'Closest': return { backgroundColor: 'rgba(40, 167, 69, 0.2)', color: '#4ade80' };
      case 'Cheapest': return { backgroundColor: 'rgba(0, 123, 255, 0.2)', color: '#60a5fa' };
      case 'Best Value': return { backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#fcd34d' };
      default: return { backgroundColor: '#333', color: '#ccc' };
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
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    // Slight shadow for depth
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 12,
  },
  distanceText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  dishName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  restaurantName: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF5A5F', // Ember Orange
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  }
});
