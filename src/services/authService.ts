import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * On-device auth. Accounts live in AsyncStorage on this phone only.
 * To move to a real backend, replace the bodies of register/login/logout/etc.
 * and keep the signatures; AuthContext and the screens won't need to change.
 */

export type User = {
  id: string;
  name: string;
  email: string;
  onboarded: boolean;
  goal?: string;
  level?: string;
};

type StoredUser = User & { salt: string; passwordHash: string };

const USERS_KEY = 'linguaear.users';
const SESSION_KEY = 'linguaear.session';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hash = (salt: string, password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

const toPublic = ({ salt: _s, passwordHash: _p, ...user }: StoredUser): User => user;

async function readUsers(): Promise<Record<string, StoredUser>> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

const writeUsers = (users: Record<string, StoredUser>) =>
  AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

export async function getSessionUser(): Promise<User | null> {
  const id = await AsyncStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const stored = (await readUsers())[id];
  return stored ? toPublic(stored) : null;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const users = await readUsers();
  const key = normalizeEmail(email);
  if (users[key]) throw new Error('An account with this email already exists.');

  const salt = Crypto.randomUUID();
  const stored: StoredUser = {
    id: key,
    name: name.trim(),
    email: key,
    onboarded: false,
    salt,
    passwordHash: await hash(salt, password),
  };
  users[key] = stored;
  await writeUsers(users);
  await AsyncStorage.setItem(SESSION_KEY, key);
  return toPublic(stored);
}

export async function login(email: string, password: string): Promise<User> {
  const stored = (await readUsers())[normalizeEmail(email)];
  // Same message for unknown email and wrong password.
  const invalid = new Error('Incorrect email or password.');
  if (!stored) throw invalid;
  if ((await hash(stored.salt, password)) !== stored.passwordHash) throw invalid;
  await AsyncStorage.setItem(SESSION_KEY, stored.id);
  return toPublic(stored);
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<User, 'onboarded' | 'goal' | 'level'>>,
): Promise<User> {
  const users = await readUsers();
  if (!users[id]) throw new Error('Account not found.');
  users[id] = { ...users[id], ...patch };
  await writeUsers(users);
  return toPublic(users[id]);
}
