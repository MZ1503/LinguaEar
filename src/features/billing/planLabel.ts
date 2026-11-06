import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { BillingStatus } from './billingTypes';
import { useBilling } from './useBilling';

export type PlanLabel = {
  /** Text such as "Pro", "Standard", "Trial · 5 days left", "Free" or "Trial ended". */
  text: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** True when the user needs to act (trial over). */
  warn: boolean;
};

export function planLabel(status: BillingStatus | null): PlanLabel | null {
  if (!status) return null;
  switch (status.state) {
    case 'subscribed':
      return { text: status.tier === 'pro' ? 'Pro' : 'Standard', icon: 'ribbon-outline', warn: false };
    case 'trial': {
      const days = status.trial_days_left ?? 0;
      return { text: `Trial · ${days} day${days === 1 ? '' : 's'} left`, icon: 'time-outline', warn: false };
    }
    case 'expired':
      return { text: 'Trial ended', icon: 'alert-circle-outline', warn: true };
    default:
      return { text: 'Free', icon: 'sparkles-outline', warn: false };
  }
}

export function usePlanLabel(): PlanLabel | null {
  return planLabel(useBilling().status);
}
