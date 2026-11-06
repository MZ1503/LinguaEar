import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Auth against the LinguaEar API (JWT access token + rotating refresh token).
 * The API only knows username/email/password, so onboarding answers (goal,
 * level) are kept on-device per account.
 */

export type User = {
  id: string;
  name: string;
  /** Optional display name; falls back to `name` (the username). */
  fullName?: string;
  bio?: string;
  email: string;
  /** False until the 6-digit code from the email has been entered. */
  emailVerified?: boolean;
  onboarded: boolean;
  goal?: string;
  level?: string;
};

type Profile = Pick<User, 'onboarded' | 'goal' | 'level'>;
type Tokens = { accessToken: string; refreshToken: string };

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };
type UserOut = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  email_verified: boolean;
  created_at: string;
};

export type ProfileChanges = { username?: string; fullName?: string; bio?: string };

const API_PORT = 8765;

/**
 * While developing, the backend runs on the same computer as Metro, and Metro's address is already known
 * to the app (it loaded its code from there). Using it means the address can never go stale when the
 * computer changes Wi-Fi, which a value baked into .env does.
 */
function developmentApiUrl(): string | null {
  if (!__DEV__) return null;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  // A tunnel's address (not a plain IP or localhost) doesn't lead to the backend, so it is ignored.
  return host && /^(localhost|\d{1,3}(\.\d{1,3}){3})$/.test(host) ? `http://${host}:${API_PORT}` : null;
}

// An https address in EXPO_PUBLIC_API_URL is a deployed backend and always wins, in builds and in development.
// Otherwise, while developing, the backend is the one on the computer running Metro, and a plain http
// address in EXPO_PUBLIC_API_URL is only the fallback.
const CONFIGURED = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const API_URL = (
  CONFIGURED?.startsWith('https://')
    ? CONFIGURED
    : (developmentApiUrl() ??
      CONFIGURED ??
      `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:${API_PORT}`)
).replace(/\/$/, '');

/** True when talking to a deployed server. Free hosting puts idle servers to sleep, and waking one takes up to a minute. */
export const IS_REMOTE_API = API_URL.startsWith('https://');

/** Longest wait for the checks the splash screen depends on. A remote server may be waking up. */
export const STARTUP_TIMEOUT_MS = IS_REMOTE_API ? 20_000 : 4_000;

/** Wakes a sleeping server early, so it is ready by the time the first real request is made. */
export function warmUpServer(): void {
  if (IS_REMOTE_API) fetch(`${API_URL}/health`).catch(() => {});
}

const TOKENS_KEY = 'linguaear.tokens';
const USER_KEY = 'linguaear.user';
const profileKey = (id: string) => `linguaear.profile.${id}`;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** FastAPI errors: `detail` is a string, or a list of validation errors. */
function detailMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (typeof (detail as { message?: unknown } | undefined)?.message === 'string') {
    return (detail as { message: string }).message;
  }
  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg).replace(/^Value error, /, '');
  }
  return fallback;
}

/** A request that may take longer than usual (uploads, AI answers) can raise its own limit. */
export type ApiRequestInit = RequestInit & { timeoutMs?: number };

// Without a limit, a server the phone can't reach makes the app wait about a minute before giving up.
const DEFAULT_TIMEOUT_MS = IS_REMOTE_API ? 30_000 : 8_000;

async function request(path: string, init: ApiRequestInit = {}, token?: string): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (err) {
    const timedOut = controller.signal.aborted;
    // The real reason is printed in the Metro terminal, since the message shown to the user is general.
    console.warn(`Request to ${API_URL}${path} failed (${timedOut ? 'timed out' : 'network error'}):`, err);
    throw new ApiError(
      0,
      timedOut
        ? 'The server took too long to answer. If it was asleep, wait a minute and try again.'
        : 'Could not reach the server. Check your connection.',
    );
  } finally {
    clearTimeout(timer);
  }
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, detailMessage(body, 'Something went wrong.'));
  return body as T;
}

const readTokens = async (): Promise<Tokens | null> => {
  const raw = await AsyncStorage.getItem(TOKENS_KEY);
  return raw ? JSON.parse(raw) : null;
};

const saveTokens = (r: TokenResponse) =>
  AsyncStorage.setItem(
    TOKENS_KEY,
    JSON.stringify({ accessToken: r.access_token, refreshToken: r.refresh_token } satisfies Tokens),
  );

const clearSession = () => AsyncStorage.multiRemove([TOKENS_KEY, USER_KEY]);

// Refresh tokens rotate, so concurrent refreshes would invalidate each other.
let refreshing: Promise<Tokens | null> | null = null;

function refreshTokens(): Promise<Tokens | null> {
  refreshing ??= (async () => {
    const tokens = await readTokens();
    if (!tokens) return null;
    const res = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) await clearSession();
      return null;
    }
    await saveTokens(await res.json());
    return readTokens();
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

let onPaymentRequired: (() => void) | null = null;

/** Called whenever the server answers 402, i.e. the free trial or plan has ended. */
export function setPaymentRequiredHandler(handler: (() => void) | null) {
  onPaymentRequired = handler;
}

/** Authenticated request that transparently refreshes an expired access token once. */
export async function authedFetch(path: string, init: ApiRequestInit = {}): Promise<Response> {
  let tokens = await readTokens();
  if (!tokens) throw new ApiError(401, 'Not signed in.');
  let res = await request(path, init, tokens.accessToken);
  if (res.status === 401) {
    tokens = await refreshTokens();
    if (!tokens) throw new ApiError(401, 'Your session has expired. Please sign in again.');
    res = await request(path, init, tokens.accessToken);
  }
  if (res.status === 402) onPaymentRequired?.();
  return res;
}

async function readProfile(id: string): Promise<Profile> {
  const raw = await AsyncStorage.getItem(profileKey(id));
  return { onboarded: false, ...(raw ? JSON.parse(raw) : {}) };
}

async function buildUser(me: UserOut): Promise<User> {
  const id = String(me.id);
  const user: User = {
    id,
    name: me.username,
    fullName: me.full_name ?? undefined,
    bio: me.bio ?? undefined,
    email: me.email,
    emailVerified: me.email_verified,
    ...(await readProfile(id)),
  };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

async function startSession(tokens: TokenResponse): Promise<User> {
  await saveTokens(tokens);
  return buildUser(await json<UserOut>(await authedFetch('/auth/me')));
}

/** `name` is the API username: 3-30 characters, letters, digits, `_` and `.`. */
export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: name.trim(), email: email.trim().toLowerCase(), password }),
  });
  return startSession(await json<TokenResponse>(res));
}

export async function login(email: string, password: string, rememberMe = false): Promise<User> {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, remember_me: rememberMe }),
  });
  return startSession(await json<TokenResponse>(res));
}

export async function getSessionUser(): Promise<User | null> {
  if (!(await readTokens())) return null;
  try {
    // A short limit: the splash screen waits for this, and offline falls back to the saved user.
    return await buildUser(
      await json<UserOut>(await authedFetch('/auth/me', { timeoutMs: STARTUP_TIMEOUT_MS })),
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      // Offline: fall back to the last known user rather than signing out.
      const cached = await AsyncStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    }
    await clearSession();
    return null;
  }
}

export async function logout(): Promise<void> {
  const tokens = await readTokens();
  await clearSession();
  if (tokens) {
    // Best effort: the server call is idempotent and the local session is already gone.
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    }).catch(() => {});
  }
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<User, 'onboarded' | 'goal' | 'level'>>,
): Promise<User> {
  const cached = await AsyncStorage.getItem(USER_KEY);
  const user: User | null = cached ? JSON.parse(cached) : null;
  if (!user || user.id !== id) throw new Error('Account not found.');
  const profile = { ...(await readProfile(id)), ...patch };
  await AsyncStorage.setItem(profileKey(id), JSON.stringify(profile));
  const updated = { ...user, ...profile };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateAccount(changes: ProfileChanges): Promise<User> {
  const res = await authedFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({
      ...(changes.username !== undefined && { username: changes.username.trim() }),
      ...(changes.fullName !== undefined && { full_name: changes.fullName.trim() }),
      ...(changes.bio !== undefined && { bio: changes.bio.trim() }),
    }),
  });
  return buildUser(await json<UserOut>(res));
}

/** Other devices are signed out by the server; this one gets fresh tokens. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await authedFetch('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  await saveTokens(await json<TokenResponse>(res));
}

export type CodeSent = { sent: boolean; retry_after: number };

/** Emails a 6-digit code. If one was sent a moment ago, nothing is sent and `retry_after` says how long to wait. */
export async function sendVerificationCode(): Promise<CodeSent> {
  return json<CodeSent>(await authedFetch('/users/me/verification-code', { method: 'POST' }));
}

export async function verifyEmail(code: string): Promise<User> {
  const res = await authedFetch('/users/me/verify-email', { method: 'POST', body: JSON.stringify({ code }) });
  return buildUser(await json<UserOut>(res));
}

/** Emails a 6-digit reset code. The answer is the same whether or not the email has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  await json<{ message: string }>(res);
}

/** Sets a new password with the emailed code. The account is signed out everywhere, so the user logs in again. */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  const res = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), code, new_password: newPassword }),
  });
  await json<{ message: string }>(res);
}

/** Permanently deletes the account (and cancels a subscription). The caller should then sign out locally. */
export async function deleteAccount(password: string): Promise<void> {
  const res = await authedFetch('/users/me', { method: 'DELETE', body: JSON.stringify({ password }) });
  if (res.status === 204) return;
  await json<unknown>(res);
}
