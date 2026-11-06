import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { fetchScenarios } from './gameApi';
import { FALLBACK_LEVELS, FALLBACK_SCENARIOS } from './scenarioFallback';
import type { GameLevel, GameScenario, LevelId } from './gameTypes';

export const LEVEL_KEY = 'linguaear.game.level';

type Loaded = { levels: GameLevel[]; scenarios: GameScenario[]; source: 'server' | 'fallback' };

// Kept between visits to the tab, so the list shows at once and refreshes quietly behind it.
let cache: Loaded | null = null;

/** The scenarios and levels from the server, with the built-in ones as a fallback if it can't be reached. */
export function useScenarios() {
  const [data, setData] = useState<Loaded>(
    cache ?? { levels: FALLBACK_LEVELS, scenarios: FALLBACK_SCENARIOS, source: 'fallback' },
  );
  const [loading, setLoading] = useState(!cache);

  const load = useCallback(async () => {
    try {
      const fresh = await fetchScenarios();
      if (fresh.scenarios.length > 0) {
        cache = { levels: fresh.levels, scenarios: fresh.scenarios, source: 'server' };
        setData(cache);
      }
    } catch {
      // Keep whatever is already shown.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...data, loading, refresh: load };
}

/** The level the player last chose, remembered on this phone. */
export async function readSavedLevel(): Promise<LevelId | null> {
  try {
    const saved = await AsyncStorage.getItem(LEVEL_KEY);
    return saved === 'beginner' || saved === 'intermediate' || saved === 'professional' ? saved : null;
  } catch {
    return null;
  }
}

export const saveLevel = (level: LevelId) => AsyncStorage.setItem(LEVEL_KEY, level).catch(() => {});
