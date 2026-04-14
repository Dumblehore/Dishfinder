import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useFavorites } from '../hooks/useFavorites';

// Card header tint based on dish type
const getTopTint = (dishName: string): string => {
  const name = dishName.toLowerCase();
  if (name.includes('momo') || name.includes('dumpling')) return '#1a2a4a';
  if (name.includes('biryani') || name.includes('rice'))  return '#2a1a10';
  if (name.includes('chicken') || name.includes('mutton'))return '#2a1a20';
  if (name.includes('paneer') || name.includes('dal'))    return '#1a2a1a';
  if (name.includes('tea') || name.includes('coffee'))    return '#1c1a10';
  return '#1e2a3a';
};

const getBottomTint = (dishName: string): string => {
  const name = dishName.toLowerCase();
  if (name.includes('momo') || name.includes('dumpling')) return '#0d1829';
  if (name.includes('biryani') || name.includes('rice'))  return '#150d06';
  if (name.includes('chicken') || name.includes('mutton'))return '#150d10';
  if (name.includes('paneer') || name.includes('dal'))    return '#0d150d';
  return '#1a1c1e';
};

const getTagStyle = (tag: string) => {
  switch (tag) {
    case 'Closest':    return { bg: 'rgba(41,68,127,0.5)',  color: '#adc7ff', emoji: '📍' };
    case 'Cheapest':   return { bg: 'rgba(41,68,127,0.5)',  color: '#adc7ff', emoji: '💰' };
    case 'Best Value': return { bg: 'rgba(127,88,41,0.5)',  color: '#ffb695', emoji: '⭐' };
    case 'Rare Dish':  return { bg: 'rgba(100,41,127,0.5)', color: '#d4a5ff', emoji: '💎' };
    default:           return { bg: 'rgba(60,65,80,0.5)',   color: '#c1c6d7', emoji: '' };
  }
};

export default function DishCard({ item }: { item: any }) {
  const formattedDistance = item.distance > 1000
    ? `${(item.distance / 1000).toFixed(1)} km`
    : `${Math.round(item.distance)} m`;

  const topTint = getTopTint(item.dish_name);
  const bottomTint = getBottomTint(item.dish_name);
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(item._id);

  const openMaps = () => {
    if (!item.location?.coordinates) return;
    const [lng, lat] = item.location.coordinates;
    const url = Platform.select({
      ios: `googlemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}`,
    }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.canOpenURL(url).then(s => Linking.openURL(s ? url : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={openMaps} style={styles.card}>
      {/* ── Colored header block (no image) ── */}
      <View style={[styles.imageArea, { backgroundColor: topTint }]}>

        {/* Rating badge — top right */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
        </View>

        {/* Dish name — bottom left over photo */}
        <View style={styles.imageOverlay}>
          <Text style={styles.dishNameLarge} numberOfLines={2}>{item.dish_name}</Text>
        </View>
      </View>

      {/* ── Details card ── */}
      <View style={[styles.detailCard, { backgroundColor: bottomTint }]}>
        {/* Restaurant + distance */}
        <View style={styles.row}>
          <Text style={styles.restaurantName} numberOfLines={1}>🏠 {item.restaurant_name}</Text>
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>📍 {formattedDistance}</Text>
          </View>
        </View>

        {/* Tags */}
        {(item.tags?.length > 0) && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag: string, i: number) => {
              const t = getTagStyle(tag);
              return (
                <View key={i} style={[styles.tagPill, { backgroundColor: t.bg }]}>
                  <Text style={[styles.tagText, { color: t.color }]}>{t.emoji} {tag}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Price + CTA + Heart */}
        <View style={[styles.row, { marginTop: 16 }]}>
          <Text style={styles.price}>₹{item.price}</Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.heartBtn, favorited && styles.heartBtnActive]}
              onPress={() => toggleFavorite(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.heartIcon, favorited && styles.heartIconActive]}>
                {favorited ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaBtn} onPress={openMaps}>
              <Text style={styles.ctaBtnText}>DIRECTIONS →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    backgroundColor: '#1e2022',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },

  // Image area — top of the card
  imageArea: {
    height: 200,
    justifyContent: 'space-between',
    padding: 16,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject, // fills the whole imageArea
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // sits on top of the image
    backgroundColor: 'rgba(0,0,0,0.45)', // dark tint so text pops
  },
  ratingBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(173,199,255,0.3)',
  },
  ratingStar: { color: '#adc7ff', fontSize: 14, fontWeight: '700' },
  ratingValue: { color: '#e2e2e5', fontSize: 13, fontWeight: '700' },

  imageOverlay: {
    justifyContent: 'flex-end',
  },
  dishNameLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: '#e2e2e5',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Details card below
  detailCard: {
    padding: 16,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 14,
    color: '#c1c6d7',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  distancePill: {
    backgroundColor: 'rgba(173,199,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(173,199,255,0.25)',
  },
  distanceText: {
    color: '#adc7ff',
    fontSize: 12,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#adc7ff',
    letterSpacing: -0.5,
  },
  ctaBtn: {
    backgroundColor: '#adc7ff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaBtnText: {
    color: '#002e68',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    borderColor: '#ff5252',
  },
  heartIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
  },
  heartIconActive: {
    color: '#ff5252',
  },
});
