import { create } from 'zustand';

import * as auth from '@/src/services/authService';
import type { User } from '@/src/services/authService';

type AuthState = {
  user: User | null;
  /** True until the stored session has been read. */
  loading: boolean;
  hydrate: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (profile: { goal?: string; level?: string }) => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      set({ user: await auth.getSessionUser() });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ user: await auth.register(name, email, password) });
  },

  login: async (email, password) => {
    set({ user: await auth.login(email, password) });
  },

  logout: async () => {
    await auth.logout();
    set({ user: null });
  },

  completeOnboarding: async (profile) => {
    const { user } = get();
    if (!user) return;
    set({ user: await auth.updateProfile(user.id, { ...profile, onboarded: true }) });
  },
}));
