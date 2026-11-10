import { createAsyncThunk } from '@reduxjs/toolkit';

import { getBillingStatus } from './billingService';

export const fetchBilling = createAsyncThunk('billing/fetch', () => getBillingStatus());
