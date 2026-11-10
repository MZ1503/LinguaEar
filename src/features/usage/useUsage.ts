import { useCallback, useEffect, useState } from 'react';

import { authedFetch } from '@/src/features/auth';

export type QuotaItem = { used: number; limit: number };

export type Usage = {
  resets_at: string;
  limits: Record<'analyze' | 'game' | 'scan' | 'transcribe', QuotaItem>;
  saved_phrases: QuotaItem;
};

/** Today's AI usage and the saved-phrase count against their limits. Loads once; call `refresh` to reload. */
export function useUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await authedFetch('/usage/me');
      if (!res.ok) throw new Error(String(res.status));
      setUsage(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { usage, failed, refresh };
}
