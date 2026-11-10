import { Redirect } from 'expo-router';

import { useAuth } from '@/src/features/auth';
import { useBilling } from '@/src/features/billing';

/**
 * Landing spot for any URL that doesn't resolve. The root route ("/") counts
 * here while the guards hide the tab group, so send people where they belong.
 */
export default function NotFound() {
  const { user } = useAuth();
  const { hasAccess } = useBilling();

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.emailVerified === false) return <Redirect href="/verify-email" />;
  if (!user.onboarded) return <Redirect href="/onboarding" />;
  if (!hasAccess) return <Redirect href="/paywall" />;
  return <Redirect href="/(tabs)" />;
}
