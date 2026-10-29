import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AnimatedSplash from '@/src/components/AnimatedSplash';
import { useAuth } from '@/src/store/authStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootStack() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);

  useEffect(() => {
    useAuth.getState().hydrate();
  }, []);

  // Keep the stack unmounted until the stored session is read, so a logged-in
  // user never sees a flash of the login screen behind the splash.
  if (loading) return null;

  const signedIn = !!user;
  const onboarded = !!user?.onboarded;

  return (
    <Stack>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="wordbank" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: '#0b0f19' }}>
          {!isSplashFinished && (
            <AnimatedSplash onAnimationFinish={() => setIsSplashFinished(true)} />
          )}
          <RootStack />
        </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
