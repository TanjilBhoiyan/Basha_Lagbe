import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'basha-lagbe:onboarding-complete';

/**
 * Remembers whether the user has finished onboarding.
 * Storage errors are swallowed on purpose: the worst case is showing onboarding again.
 */
export const onboardingStorage = {
  async isComplete(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
    } catch {
      return false;
    }
  },

  async markComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // ignore
    }
  },

  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch {
      // ignore
    }
  },
};