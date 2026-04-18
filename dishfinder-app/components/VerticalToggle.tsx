import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolateColor,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface VerticalToggleProps {
  isOn: boolean;
  onToggle: () => void;
  type: 'veg' | 'nonveg';
}

export default function VerticalToggle({ isOn, onToggle, type }: VerticalToggleProps) {
  // 0 = OFF (thumb at bottom), 1 = ON (thumb at top)
  const progress = useSharedValue(isOn ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isOn ? 1 : 0, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
  }, [isOn]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const isVeg = type === 'veg';
  const activeColor = isVeg ? '#30d158' : '#ff6b6b';
  const activeBg = isVeg ? 'rgba(48,209,88,0.15)' : 'rgba(255,107,107,0.15)';
  const inactiveBg = 'rgba(255,255,255,0.05)';

  // ── Animated Styles ──
  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [inactiveBg, activeBg]
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        ['rgba(255,255,255,0.1)', activeColor]
      ),
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          // Container inner height is ~88. Thumb is 36. Distance to travel is ~44.
          // Let's use exact translation: Bottom rests at Y=44, Top rests at Y=0.
          // progress 0 -> translate 44 (bottom). progress 1 -> translate 0 (top).
          translateY: interpolate(progress.value, [0, 1], [44, 0])
        }
      ],
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        ['#414754', activeColor]
      )
    };
  });

  const textContainerStyle = useAnimatedStyle(() => {
    // text moves opposite to thumb so it stays in the empty space
    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [-20, 20]) }
      ]
    };
  });

  // Food Icon symbol native draw
  const ThumbIcon = () => (
    <View style={[styles.symbolBox, { borderColor: isVeg ? '#30d158' : '#ff6b6b' }]}>
      <View style={[
        isVeg ? styles.symbolDot : styles.symbolTriangle, 
        isVeg ? { backgroundColor: '#30d158' } : { borderBottomColor: '#ff6b6b' }
      ]} />
    </View>
  );

  return (
    <Pressable onPress={handlePress} style={styles.touchArea}>
      <Animated.View style={[styles.track, containerStyle]}>
        
        {/* The Text Label */}
        <Animated.View style={[styles.textContainer, textContainerStyle]}>
          <Text style={[styles.statusText, isOn && { color: activeColor }]}>
            {isOn ? 'ON' : 'OFF'}
          </Text>
        </Animated.View>

        {/* The Sliding Thumb */}
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <ThumbIcon />
        </Animated.View>

      </Animated.View>
      <Text style={styles.outerLabel}>{isVeg ? 'Veg Only' : 'Non-Veg'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  track: {
    width: 48,
    height: 92,
    borderRadius: 24,
    borderWidth: 2,
    padding: 4,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    position: 'absolute',
    top: 44, // middle bottom
    width: '100%',
    alignItems: 'center',
    left: 4, // accounts for track padding
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8b90a0',
    letterSpacing: 0.5,
  },
  outerLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#c1c6d7',
  },

  // Native Indian Food Mark drawing
  symbolBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  symbolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  symbolTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  }
});
