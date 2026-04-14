import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, Alert
} from 'react-native';
import { useFavorites } from '../../hooks/useFavorites';
import { useSearchHistory } from '../../hooks/useSearchHistory';

const APP_VERSION = '1.0.0';

const COLORS = {
  background:        '#121416',
  surface:           '#1a1c1e',
  surfaceHigh:       '#282a2c',
  primary:           '#adc7ff',
  onSurface:         '#e2e2e5',
  onSurfaceVariant:  '#c1c6d7',
  outline:           '#414754',
  danger:            '#ff6b6b',
};

function StatCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon, label, value, onPress, danger = false
}: { icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[styles.settingsLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      {onPress && <Text style={styles.settingsArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { favorites, clearAllFavorites } = useFavorites();
  const { history, clearHistory }        = useSearchHistory();

  const confirmClearFavorites = () => {
    Alert.alert(
      'Clear All Favourites',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearAllFavorites },
      ]
    );
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Clear Search History',
      'This will remove all recent searches.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>DishFinder User</Text>
          <Text style={styles.userSub}>Delhi NCR · Food Explorer</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard emoji="♥" value={favorites.length} label="Favourites" />
          <StatCard emoji="🕐" value={history.length} label="Recent Searches" />
          <StatCard emoji="🍽️" value="8,795+" label="Dishes Available" />
        </View>

        {/* ── App Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionCard}>
            <SettingsRow icon="📱" label="Version"      value={APP_VERSION} />
            <View style={styles.divider} />
            <SettingsRow icon="📍" label="Data Region"  value="Delhi NCR" />
            <View style={styles.divider} />
            <SettingsRow icon="🌐" label="Backend"      value="Render (Free)" />
          </View>
        </View>

        {/* ── Data Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="🕐"
              label="Clear Search History"
              onPress={history.length > 0 ? confirmClearHistory : undefined}
              value={history.length === 0 ? 'Empty' : undefined}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="♥"
              label="Clear All Favourites"
              danger
              onPress={favorites.length > 0 ? confirmClearFavorites : undefined}
              value={favorites.length === 0 ? 'None saved' : undefined}
            />
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionCard}>
            <SettingsRow icon="🍜" label="DishFinder" value="Find any dish, anywhere" />
            <View style={styles.divider} />
            <SettingsRow icon="💾" label="Database"   value="MongoDB Atlas" />
            <View style={styles.divider} />
            <SettingsRow icon="⚡" label="Built with" value="Expo + React Native" />
          </View>
        </View>

        <Text style={styles.footer}>Made with ❤️ for food lovers in Delhi NCR</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 60 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 2.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarEmoji: { fontSize: 40 },
  userName:    { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.3 },
  userSub:     { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },

  // Stats
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.outline,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center' },

  // Settings sections
  section:     { marginBottom: 22 },
  sectionTitle: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.outline },

  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  settingsIcon:  { fontSize: 20, width: 28 },
  settingsLabel: { flex: 1, color: COLORS.onSurface, fontSize: 15, fontWeight: '500' },
  settingsValue: { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '500' },
  settingsArrow: { color: COLORS.onSurfaceVariant, fontSize: 20, fontWeight: '300' },

  divider: { height: 1, backgroundColor: COLORS.outline, marginLeft: 56 },

  footer: { textAlign: 'center', color: COLORS.onSurfaceVariant, fontSize: 13, marginTop: 20, lineHeight: 20 },
});
