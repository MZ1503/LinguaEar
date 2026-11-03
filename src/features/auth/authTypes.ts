import type { User } from './authService';

export type { User };

export type AuthState = {
  user: User | null;
  /** True until the stored session has been read. */
  loading: boolean;
};

/** Shape the auth thunks need from the root state, so they don't import the store. */
export type AuthRootState = { auth: AuthState };
