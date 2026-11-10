import type { BillingRootState } from './billingTypes';

export const selectBilling = (s: BillingRootState) => s.billing;
/** Unknown status counts as access: the server decides, and answers 402 when it must. */
export const selectHasAccess = (s: BillingRootState) => s.billing.status?.access ?? true;
