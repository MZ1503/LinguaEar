import AsyncStorage from '@react-native-async-storage/async-storage';
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
  created_at: string;
};

export type ProfileChanges = { username?: string; fullName?: string; bio?: string };

// A physical phone can't reach "localhost": set EXPO_PUBLIC_API_URL to your computer's LAN IP.
const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:8765`
).replace(/\/$/, '');

const TOKENS_KEY = 'linguaear.tokens';
const USER_KEY = 'linguaear.user';
const profileKey = (id: string) => `linguaear.profile.${id}`;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** FastAPI errors: `detail` is a string, or a list of validation errors. */
function detailMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg).replace(/^Value error, /, '');
  }
  return fallback;
}

async function request(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.');
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

/** Authenticated request that transparently refreshes an expired access token once. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let tokens = await readTokens();
  if (!tokens) throw new ApiError(401, 'Not signed in.');
  let res = await request(path, init, tokens.accessToken);
  if (res.status === 401) {
    tokens = await refreshTokens();
    if (!tokens) throw new ApiError(401, 'Your session has expired. Please sign in again.');
    res = await request(path, init, tokens.accessToken);
  }
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
    return await buildUser(await json<UserOut>(await authedFetch('/auth/me')));
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
