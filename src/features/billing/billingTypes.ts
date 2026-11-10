export type Tier = 'standard' | 'pro';

export type PlanInfo = {
  tier: Tier;
  price_label: string;
  analyze_per_day: number;
  game_per_day: number;
  scan_per_day: number;
  transcribe_per_day: number;
  saved_phrases: number;
};

export type BillingStatus = {
  access: boolean;
  /** "free" means the server has no paywall (development). */
  state: 'free' | 'trial' | 'subscribed' | 'expired';
  tier: Tier | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  trial_days_left: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  enforced: boolean;
  plans: PlanInfo[];
};

export type BillingState = {
  status: BillingStatus | null;
  /** True once the first load has finished, whether it worked or not. */
  loaded: boolean;
  /** Set when someone signs in or signs up, until the plan notice has been shown. */
  loginNotice: boolean;
};

export type BillingRootState = { billing: BillingState };
