import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SkeletonCard() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.imageArea} />
      <View style={styles.detailCard}>
        <View style={styles.row}>
          <View style={styles.textLineLong} />
          <View style={styles.textLineShort} />
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          <View style={styles.tagLine} />
          <View style={styles.tagLine} />
          <View style={styles.tagLine} />
        </View>
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={styles.priceLine} />
          <View style={styles.buttonLine} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    backgroundColor: '#1E2022',
  },
  imageArea: {
    height: 200,
    backgroundColor: '#282C34',
  },
  detailCard: {
    padding: 16,
    paddingTop: 14,
    backgroundColor: '#151719',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  textLineLong: { height: 16, borderRadius: 8, backgroundColor: '#282C34', flex: 1 },
  textLineShort: { height: 24, width: 60, borderRadius: 12, backgroundColor: '#282C34' },
  tagLine: { height: 20, width: 70, borderRadius: 10, backgroundColor: '#282C34' },
  priceLine: { height: 28, width: 80, borderRadius: 8, backgroundColor: '#282C34' },
  buttonLine: { height: 36, width: 120, borderRadius: 18, backgroundColor: '#282C34' },
});
