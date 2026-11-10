import { createSlice } from '@reduxjs/toolkit';

import { login, logout, register } from '@/src/features/auth';

import { fetchBilling } from './billingThunks';
import type { BillingState } from './billingTypes';

const initialState: BillingState = { status: null, loaded: false, loginNotice: false };

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    noticeShown: (state) => {
      state.loginNotice = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBilling.fulfilled, (state, { payload }) => {
        state.status = payload;
        state.loaded = true;
      })
      // If the status can't be loaded (offline), let the user in; the server still enforces access.
      .addCase(fetchBilling.rejected, (state) => {
        state.loaded = true;
      })
      // A fresh sign-in or sign-up earns one plan notice; restoring a saved session does not.
      .addCase(login.fulfilled, (state) => {
        state.loginNotice = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.loginNotice = true;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { noticeShown } = billingSlice.actions;
export default billingSlice.reducer;
