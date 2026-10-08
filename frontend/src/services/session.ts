import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { User } from '@/types/auth';

const SESSION_KEY = 'basha-lagbe:session';
const TOKEN_KEY = 'basha-lagbe.token';

/**
 * The login token is a password-equivalent, so on phones it goes in the
 * encrypted keychain/keystore (SecureStore). Web has no SecureStore.
 */
const tokenStore = {
  get: () =>
    Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.setItem(TOKEN_KEY, value)
      : SecureStore.setItemAsync(TOKEN_KEY, value),
  remove: () =>
    Platform.OS === 'web' ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const session = {
  async getUser(): Promise<User | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  async save(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await tokenStore.get();
    } catch {
      return null;
    }
  },

  async saveToken(token: string): Promise<void> {
    try {
      await tokenStore.set(token);
    } catch {
      // ignore
    }
  },

  /** Logout: forget both the user and the token. */
  async clear(): Promise<void> {
    try {
      await Promise.all([AsyncStorage.removeItem(SESSION_KEY), tokenStore.remove()]);
    } catch {
      // ignore
    }
  },
};