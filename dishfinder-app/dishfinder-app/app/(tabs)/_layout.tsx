import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';

// Simple text icon fallback since we don't need native icon fonts
function TabIcon({ label, active }: { label: string; active: boolean }) {
  const icons: Record<string, string> = {
    home: '⌂',
    explore: '◉',
    favorites: '♡',
    profile: '◎',
  };
  return (
    <Text style={{ fontSize: 20, color: active ? '#adc7ff' : '#8b90a0' }}>
      {icons[label] || '●'}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#adc7ff',
        tabBarInactiveTintColor: '#8b90a0',
        tabBarStyle: {
          backgroundColor: 'rgba(18, 20, 22, 0.85)',
          borderTopColor: '#414754',
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          // Frosted glass feel
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 30,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontFamily: undefined,
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarActiveBackgroundColor: 'transparent',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="home" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => <TabIcon label="favorites" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="profile" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon label="explore" active={focused} />,
        }}
      />
    </Tabs>
  );
}
