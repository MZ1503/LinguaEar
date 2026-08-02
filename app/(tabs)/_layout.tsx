import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      
      {/* 1. Home Screen Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Speak',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'ear' : 'ear-outline'} size={26} color={color} />
        ),
        }}
      />
      
     
      {/* 2. Game Screen */}
      <Tabs.Screen
        name="GameMode"
        options={{
          title: 'Game Mode',
          tabBarIcon: ({ color, focused }) => (
           
            <Ionicons name={focused ? 'dice' : 'dice-outline'} size={26} color={color} />
          ),
        }}
      />

      {/* 3. Privacy Screen*/}
      <Tabs.Screen
        name="privacy"
        options={{
          title: 'Privacy',
          tabBarIcon: ({ color, focused }) => (
            
            <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={26} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}