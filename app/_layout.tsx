import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import AnimatedSplash from '@/src/components/AnimatedSplash';
import { Provider } from 'react-redux';

import { hydrate, useAuth } from '@/src/features/auth';
import { hydrateTheme } from '@/src/shared/theme/themeSlice';
import { useTheme } from '@/src/shared/theme/useTheme';
import { store } from '@/src/store';
import { useAppDispatch } from '@/src/store/hooks';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootStack() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrate());
    dispatch(hydrateTheme());
  }, [dispatch]);

  // Keep the stack unmounted until the stored session is read, so a logged-in
  // user never sees a flash of the login screen behind the splash.
  if (loading) return null;

  const signedIn = !!user;
  const onboarded = !!user?.onboarded;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerBackTitle: 'Back' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit profile', headerBackTitle: 'Back' }} />
        <Stack.Screen name="change-password" options={{ title: 'Change password', headerBackTitle: 'Back' }} />
        <Stack.Screen name="history" options={{ title: 'Saved phrases', headerBackTitle: 'Back' }} />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedApp() {
  const { isDark, colors } = useTheme();
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {!isSplashFinished && (
            <AnimatedSplash onAnimationFinish={() => setIsSplashFinished(true)} />
          )}
          <RootStack />
        </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
}
