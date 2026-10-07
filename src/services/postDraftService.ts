import AsyncStorage from '@react-native-async-storage/async-storage';

import { EMPTY_DRAFT, type PropertyDraft } from '@/features/post/draft';

const DRAFT_KEY = 'basha-lagbe:post-draft';

/** Keeps the Add Property form on the phone so the owner never loses what they typed. */
export const postDraftService = {
  async load(): Promise<{ draft: PropertyDraft; step: number }> {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (!raw) return { draft: EMPTY_DRAFT, step: 0 };
      const saved = JSON.parse(raw) as { draft: Partial<PropertyDraft>; step: number };
      // Merge with EMPTY_DRAFT so fields added in later versions get defaults.
      return { draft: { ...EMPTY_DRAFT, ...saved.draft }, step: saved.step ?? 0 };
    } catch {
      return { draft: EMPTY_DRAFT, step: 0 };
    }
  },

  async save(draft: PropertyDraft, step: number): Promise<void> {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step }));
    } catch {
      // ignore
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  },
};