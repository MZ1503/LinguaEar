import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';

import { ProfileButton } from '@/src/features/profile';
import { ScoreChip, useScoreSync } from '@/src/features/score';
import { AppHeader } from '@/src/shared/ui/AppHeader';
import { FloatingTabBar } from '@/src/shared/ui/FloatingTabBar';
import { ThemeToggle } from '@/src/shared/ui/ThemeToggle';

type IconName = keyof typeof Ionicons.glyphMap;

type IconProps = { color: ColorValue; focused: boolean };

const tabIcon = (active: IconName, inactive: IconName) => {
  const TabIcon = ({ color, focused }: IconProps) => (
    <Ionicons name={focused ? active : inactive} size={24} color={color as string} />
  );
  return TabIcon;
};

export default function TabLayout() {
  useScoreSync();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        header: () => (
          <AppHeader
            right={
              <>
                <ScoreChip />
                <ThemeToggle />
                <ProfileButton />
              </>
            }
          />
        ),
      }}>
      <Tabs.Screen name="index" options={{ title: 'Speak', tabBarIcon: tabIcon('ear', 'ear-outline') }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: tabIcon('camera', 'camera-outline') }} />
      <Tabs.Screen name="GameMode" options={{ title: 'Game', tabBarIcon: tabIcon('dice', 'dice-outline') }} />
    </Tabs>
  );
}
