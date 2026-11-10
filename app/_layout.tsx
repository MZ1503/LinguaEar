import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import AnimatedSplash from '@/src/components/AnimatedSplash';
import { Provider } from 'react-redux';

import { hydrate, useAuth, warmUpServer } from '@/src/features/auth';
import { useBilling, useBillingSync } from '@/src/features/billing';
import { hydrateTheme } from '@/src/shared/theme/themeSlice';
import { useTheme } from '@/src/shared/theme/useTheme';
import { AlertProvider } from '@/src/shared/ui/AlertProvider';
import { BackButton } from '@/src/shared/ui/BackButton';
import { store } from '@/src/store';
import { useAppDispatch } from '@/src/store/hooks';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootStack() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { loaded: billingLoaded, hasAccess } = useBilling();
  useBillingSync(!!user);

  useEffect(() => {
    warmUpServer();
    dispatch(hydrate());
    dispatch(hydrateTheme());
  }, [dispatch]);

  const signedIn = !!user;
  // An older saved session may not know yet; only an explicit `false` means unverified.
  const verified = user?.emailVerified !== false;
  const onboarded = !!user?.onboarded;

  // Where this person belongs right now. Every guarded group below sends people here when its screen stops
  // being available (after sign-up, verification, sign-out, an ended trial) and when the app opens on a screen
  // they may not see. Without it the router picks the shortest-named unguarded file, which is Terms.
  // The tabs are written as '/(tabs)' because '/' is also the sign-in welcome screen: a redirect to '/' for a
  // signed-in user lands on that guarded screen and redirects again, forever.
  const home = !signedIn
    ? '/login'
    : !verified
      ? '/verify-email'
      : !onboarded
        ? '/onboarding'
        : hasAccess
          ? '/(tabs)'
          : '/paywall';

  // Keep the stack unmounted until the stored session is read, so a logged-in
  // user never sees a flash of the login screen behind the splash.
  if (loading) return null;
  // A signed-in user waits for the first billing check, so the paywall never flashes by mistake.
  if (user && !billingLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}>
      <Stack.Protected guard={!signedIn} redirectTo={home}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !verified} redirectTo={home}>
        <Stack.Screen name="verify-email" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && verified && !onboarded} redirectTo={home}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      {/* The app itself needs an active trial or plan. */}
      <Stack.Protected guard={signedIn && verified && onboarded && hasAccess} redirectTo={home}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="history" options={{ title: 'Saved phrases', headerBackTitle: 'Back' }} />
      </Stack.Protected>
      {/* Account and plan screens stay reachable after the trial ends; the paywall comes first. */}
      <Stack.Protected guard={signedIn && verified && onboarded} redirectTo={home}>
        <Stack.Screen name="paywall" options={{ title: 'Plans', headerBackTitle: 'Back' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerBackTitle: 'Back' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit profile', headerBackTitle: 'Back' }} />
        <Stack.Screen name="change-password" options={{ title: 'Change password', headerBackTitle: 'Back' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerBackTitle: 'Back' }} />
        <Stack.Screen name="notifications" options={{ title: 'Email notifications', headerBackTitle: 'Back' }} />
        <Stack.Screen name="support" options={{ title: 'Support', headerBackTitle: 'Back' }} />
        <Stack.Screen name="new-ticket" options={{ title: 'New request', headerBackTitle: 'Back' }} />
        <Stack.Screen name="ticket" options={{ title: 'Request', headerBackTitle: 'Back' }} />
        <Stack.Screen name="suggest-scenario" options={{ title: 'Suggest a scenario', headerBackTitle: 'Back' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Delete account', headerBackTitle: 'Back' }} />
      </Stack.Protected>
      {/* Legal pages are readable by anyone, including from the sign-up screen. */}
      <Stack.Protected guard>
        <Stack.Screen
          name="terms"
          options={{ title: 'Terms & conditions', headerBackVisible: false, headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="privacy"
          options={{ title: 'Privacy policy', headerBackVisible: false, headerLeft: () => <BackButton /> }}
        />
        <Stack.Screen
          name="impressum"
          options={{ title: 'Legal notice', headerBackVisible: false, headerLeft: () => <BackButton /> }}
        />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedApp() {
  const { isDark, colors } = useTheme();
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AlertProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {!isSplashFinished && (
            <AnimatedSplash onAnimationFinish={() => setIsSplashFinished(true)} />
          )}
          <RootStack />
        </View>
      </AlertProvider>
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
