import { Redirect } from 'expo-router';

import { useAuth } from '@/src/features/auth';

/**
 * Landing spot for any URL that doesn't resolve. The root route ("/") counts
 * here while the guards hide the tab group, so send people where they belong.
 */
export default function NotFound() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!user.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
