import { createSlice } from '@reduxjs/toolkit';

import { completeOnboarding, hydrate, login, logout, register, saveProfile, verifyEmail } from './authThunks';
import type { AuthState } from './authTypes';

const initialState: AuthState = { user: null, loading: true };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(hydrate.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.loading = false;
      })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(completeOnboarding.fulfilled, (state, { payload }) => {
        if (payload) state.user = payload;
      })
      .addCase(verifyEmail.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(saveProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;
