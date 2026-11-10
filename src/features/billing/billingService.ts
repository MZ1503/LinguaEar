import { STARTUP_TIMEOUT_MS, authedFetch } from '@/src/features/auth';

import type { BillingStatus, Tier } from './billingTypes';

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : (detail?.message ?? 'Something went wrong.'));
  }
  return body as T;
}

// Short limit: the app waits for this at start-up, and an unknown status lets the user in.
export const getBillingStatus = () =>
  authedFetch('/billing/status', { timeoutMs: STARTUP_TIMEOUT_MS }).then((r) => parse<BillingStatus>(r));

export const createCheckout = (tier: Tier, returnUrl: string) =>
  authedFetch('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ tier, return_url: returnUrl }),
  }).then((r) => parse<{ url: string }>(r));

export const createPortal = (returnUrl: string) =>
  authedFetch('/billing/portal', { method: 'POST', body: JSON.stringify({ return_url: returnUrl }) }).then(
    (r) => parse<{ url: string }>(r),
  );
