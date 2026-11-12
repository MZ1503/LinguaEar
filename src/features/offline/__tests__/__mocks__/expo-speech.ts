// Minimal stub so Jest can import expo-speech without native modules.
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const jest: any;
export const speak = jest.fn().mockResolvedValue(undefined as any);
export const stop = jest.fn().mockResolvedValue(undefined as any);
export const isSpeakingAsync = jest.fn().mockResolvedValue(false);
