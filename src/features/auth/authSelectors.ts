import type { AuthRootState } from './authTypes';

export const selectUser = (s: AuthRootState) => s.auth.user;
export const selectAuthLoading = (s: AuthRootState) => s.auth.loading;
export const selectIsSignedIn = (s: AuthRootState) => !!s.auth.user;
export const selectIsOnboarded = (s: AuthRootState) => !!s.auth.user?.onboarded;
