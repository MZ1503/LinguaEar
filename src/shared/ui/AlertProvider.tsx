import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AlertCard } from './AlertCard';
import type { AlertButton, AlertOptions } from './AlertCard';

type AlertApi = {
  /** Shows an alert card. Alerts asked for while one is open wait their turn. */
  show: (options: AlertOptions) => void;
  /** A red problem card with one OK button. */
  error: (title: string, message?: string) => void;
  /** A green card with one OK button; `onClose` runs when it is dismissed, e.g. to go back. */
  success: (title: string, message?: string, onClose?: () => void) => void;
};

const AlertContext = createContext<AlertApi | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<AlertOptions[]>([]);
  const current = queue[0];

  const show = useCallback((options: AlertOptions) => setQueue((q) => [...q, options]), []);

  const close = useCallback((button?: AlertButton) => {
    setQueue((q) => q.slice(1));
    button?.onPress?.();
  }, []);

  // Alerts with a timer close themselves.
  useEffect(() => {
    if (!current?.timer) return;
    const handle = setTimeout(() => close(), current.timer);
    return () => clearTimeout(handle);
  }, [current, close]);

  const api = useMemo<AlertApi>(
    () => ({
      show,
      error: (title, message) => show({ type: 'error', title, message }),
      success: (title, message, onClose) =>
        show({ type: 'success', title, message, buttons: [{ text: 'OK', onPress: onClose }] }),
    }),
    [show],
  );

  return (
    <AlertContext.Provider value={api}>
      {children}
      {current && <AlertCard key={queue.length + current.title} {...current} onClose={close} />}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertApi {
  const api = useContext(AlertContext);
  if (!api) throw new Error('useAlert must be used inside AlertProvider');
  return api;
}
