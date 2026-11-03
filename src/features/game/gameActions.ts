import { createAction } from '@reduxjs/toolkit';

// Plain actions live apart from the slice so thunks can dispatch them without
// importing the slice (which imports the thunks).
export const setStatus = createAction<string>('game/setStatus');
export const speechHeard = createAction<string>('game/speechHeard');
