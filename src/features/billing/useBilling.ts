import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { setPaymentRequiredHandler } from '@/src/features/auth';
import { useAlert } from '@/src/shared/ui/AlertProvider';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { createCheckout, createPortal } from './billingService';
import { selectBilling, selectHasAccess } from './billingSelectors';
import { noticeShown } from './billingSlice';
import { fetchBilling } from './billingThunks';
import type { Tier } from './billingTypes';

// Lets the browser session finish cleanly when the app is opened by the return link.
WebBrowser.maybeCompleteAuthSession();

/** The link Stripe's page bounces to, which reopens this app (linguaear:// in a build, exp:// in Expo Go). */
const returnLink = () => Linking.createURL('billing/return');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useBilling() {
  const dispatch = useAppDispatch();
  const { status, loaded } = useAppSelector(selectBilling);
  const hasAccess = useAppSelector(selectHasAccess);

  const refresh = useCallback(
    () =>
      dispatch(fetchBilling())
        .unwrap()
        .catch(() => null),
    [dispatch],
  );

  /**
   * Opens Stripe Checkout in a secure browser sheet. When payment finishes, our server redirects to the
   * app link, which closes the sheet and returns here. Stripe tells the server about the payment a moment
   * later, so the status is checked a few times until the subscription shows up.
   */
  const subscribe = useCallback(
    async (tier: Tier) => {
      const link = returnLink();
      const { url } = await createCheckout(tier, link);
      const result = await WebBrowser.openAuthSessionAsync(url, link);
      // Backed out or closed the sheet without paying: nothing to wait for.
      if (result.type === 'success' && result.url.includes('result=cancel')) return 'cancelled' as const;
      for (let attempt = 0; attempt < 8; attempt++) {
        const next = await refresh();
        if (next?.state === 'subscribed') return 'subscribed' as const;
        await sleep(1500);
      }
      return 'pending' as const;
    },
    [refresh],
  );

  /** Stripe's own page for changing plan, the card and cancelling. */
  const manage = useCallback(async () => {
    const link = returnLink();
    const { url } = await createPortal(link);
    await WebBrowser.openAuthSessionAsync(url, link);
    await refresh();
  }, [refresh]);

  return { status, loaded, hasAccess, refresh, subscribe, manage };
}

/** Keeps the status fresh for a signed-in user: on start, when the app returns, and after a 402. */
export function useBillingSync(signedIn: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!signedIn) return;
    dispatch(fetchBilling());

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') dispatch(fetchBilling());
    });
    setPaymentRequiredHandler(() => dispatch(fetchBilling()));

    return () => {
      subscription.remove();
      setPaymentRequiredHandler(null);
    };
  }, [signedIn, dispatch]);
}

/**
 * Each time someone signs in on a trial (or the free version), says so and asks them to choose a plan.
 * Subscribers see nothing. Mount it where the signed-in app is shown, so it appears after verification
 * and onboarding.
 */
export function useLoginNotice() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const alert = useAlert();
  const { status, loginNotice } = useAppSelector(selectBilling);

  useEffect(() => {
    if (!loginNotice || !status || !status.access) return;
    dispatch(noticeShown());

    const buttons = [
      { text: 'Choose a plan', onPress: () => router.push('/paywall') },
      { text: 'Later', style: 'cancel' as const },
    ];

    if (status.state === 'trial') {
      const days = status.trial_days_left ?? 0;
      const ends = status.trial_ends_at
        ? new Date(status.trial_ends_at).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null;
      alert.show({
        type: 'info',
        title: 'You are on a free trial',
        message: `Your trial ${ends ? `ends on ${ends}` : 'will end soon'} (${days} day${days === 1 ? '' : 's'} left). After that you will need a plan to keep using LinguaEar. Please choose a plan.`,
        buttons,
      });
    } else if (status.state === 'free') {
      alert.show({
        type: 'info',
        title: 'You are on the free plan',
        message:
          'Free access may expire and daily limits apply. Please choose a plan to keep using LinguaEar.',
        buttons,
      });
    }
  }, [loginNotice, status, dispatch, router, alert]);
}
