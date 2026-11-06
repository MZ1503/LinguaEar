import { useAppDispatch, useAppSelector } from '@/src/store/hooks';

import { selectAuthLoading, selectUser } from './authSelectors';
import {
  changePassword,
  completeOnboarding,
  login,
  logout,
  register,
  saveProfile,
  verifyEmail,
} from './authThunks';
import { sendVerificationCode } from './authService';
import type { ProfileChanges } from './authService';

/** unwrap() rejects with the thunk's rejectValue (a string); screens expect an Error. */
async function settle(action: { unwrap: () => Promise<unknown> }) {
  try {
    await action.unwrap();
  } catch (err) {
    throw err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Something went wrong.');
  }
}

/** Auth state plus actions that resolve on success and throw an Error with the server's message on failure. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);

  return {
    user,
    loading,
    register: (name: string, email: string, password: string) =>
      settle(dispatch(register({ name, email, password }))),
    login: (email: string, password: string, rememberMe?: boolean) =>
      settle(dispatch(login({ email, password, rememberMe }))),
    verifyEmail: (code: string) => settle(dispatch(verifyEmail(code))),
    sendVerificationCode,
    saveProfile: (changes: ProfileChanges) => settle(dispatch(saveProfile(changes))),
    changePassword: (currentPassword: string, newPassword: string) =>
      settle(dispatch(changePassword({ currentPassword, newPassword }))),
    logout: () => dispatch(logout()).unwrap(),
    completeOnboarding: (profile: { goal?: string; level?: string }) =>
      settle(dispatch(completeOnboarding(profile))),
  };
}
