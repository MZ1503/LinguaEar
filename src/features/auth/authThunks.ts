import { createAsyncThunk } from '@reduxjs/toolkit';

import * as api from './authService';
import type { AuthRootState, User } from './authTypes';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');

type Config = { rejectValue: string; state: AuthRootState };

// Rejections carry a plain message string so they stay serializable.
export const hydrate = createAsyncThunk('auth/hydrate', async () => {
  try {
    return await api.getSessionUser();
  } catch {
    return null;
  }
});

export const register = createAsyncThunk<
  User,
  { name: string; email: string; password: string },
  Config
>('auth/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    return await api.register(name, email, password);
  } catch (err) {
    return rejectWithValue(messageOf(err));
  }
});

export const login = createAsyncThunk<
  User,
  { email: string; password: string; rememberMe?: boolean },
  Config
>('auth/login', async ({ email, password, rememberMe }, { rejectWithValue }) => {
  try {
    return await api.login(email, password, rememberMe);
  } catch (err) {
    return rejectWithValue(messageOf(err));
  }
});

export const saveProfile = createAsyncThunk<User, api.ProfileChanges, Config>(
  'auth/saveProfile',
  async (changes, { rejectWithValue }) => {
    try {
      return await api.updateAccount(changes);
    } catch (err) {
      return rejectWithValue(messageOf(err));
    }
  },
);

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  Config
>('auth/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    await api.changePassword(currentPassword, newPassword);
  } catch (err) {
    return rejectWithValue(messageOf(err));
  }
});

export const verifyEmail = createAsyncThunk<User, string, Config>(
  'auth/verifyEmail',
  async (code, { rejectWithValue }) => {
    try {
      return await api.verifyEmail(code);
    } catch (err) {
      return rejectWithValue(messageOf(err));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', () => api.logout());

export const completeOnboarding = createAsyncThunk<
  User | null,
  { goal?: string; level?: string },
  Config
>('auth/completeOnboarding', async (profile, { getState, rejectWithValue }) => {
  const { user } = getState().auth;
  if (!user) return null;
  try {
    return await api.updateProfile(user.id, { ...profile, onboarded: true });
  } catch (err) {
    return rejectWithValue(messageOf(err));
  }
});
