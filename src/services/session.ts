import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/types/auth';

const SESSION_KEY = 'basha-lagbe:session';

// TODO: move the token to expo-secure-store once the real backend issues one.
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

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  },
};