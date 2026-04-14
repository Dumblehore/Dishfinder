import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7,  duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      {/* Image area */}
      <View style={styles.imageArea} />

      {/* Details */}
      <View style={styles.detail}>
        <View style={styles.row}>
          <View style={styles.restaurantSkeleton} />
          <View style={styles.distSkeleton} />
        </View>
        <View style={styles.nameSkeleton} />
        <View style={styles.nameSkeletonShort} />
        <View style={styles.bottomRow}>
          <View style={styles.priceSkeleton} />
          <View style={styles.btnSkeleton} />
        </View>
      </View>
    </Animated.View>
  );
}

const BG = '#2a2c2e';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    backgroundColor: '#1e2022',
  },
  imageArea:    { height: 190, backgroundColor: BG },
  detail:       { padding: 16, gap: 10 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restaurantSkeleton: { height: 13, width: 140, borderRadius: 6, backgroundColor: BG },
  distSkeleton:       { height: 13, width: 55,  borderRadius: 10, backgroundColor: BG },
  nameSkeleton:       { height: 20, width: '80%', borderRadius: 6, backgroundColor: BG },
  nameSkeletonShort:  { height: 20, width: '50%', borderRadius: 6, backgroundColor: BG },
  bottomRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  priceSkeleton: { height: 28, width: 70,  borderRadius: 6,  backgroundColor: BG },
  btnSkeleton:   { height: 38, width: 120, borderRadius: 20, backgroundColor: BG },
});
